import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  InventoryMovementEntity,
  InventoryOperationType,
  InventoryMovementType,
} from '../database/entities/inventory-movement.entity';
import { ProductEntity } from '../database/entities/product.entity';

type CreateMovementInput = {
  productId: string;
  type: InventoryMovementType;
  operationType?: InventoryOperationType;
  quantity: number;
  branchName?: string;
  reason?: string;
  actorId?: string;
  actorName?: string;
};

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productsRepo: Repository<ProductEntity>,
    @InjectRepository(InventoryMovementEntity)
    private readonly movementsRepo: Repository<InventoryMovementEntity>,
  ) {}

  async findProductStock(
    search?: string,
    branchName?: string,
    limit?: number,
    offset?: number,
  ) {
    const take = Math.max(1, Math.min(500, Number(limit ?? 200)));
    const skip = Math.max(0, Number(offset ?? 0));
    const qb = this.productsRepo
      .createQueryBuilder('p')
      .orderBy('p.updatedAt', 'DESC');

    if (branchName?.trim()) {
      qb.where('p.branchName = :branchName', { branchName: branchName.trim() });
    }

    if (search?.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      const filterSql =
        '(LOWER(p.name) LIKE :q OR LOWER(COALESCE(p.supplier, \'\')) LIKE :q)';
      if (branchName?.trim()) {
        qb.andWhere(filterSql, { q });
      } else {
        qb.where(filterSql, { q });
      }
    }

    qb.skip(skip).take(take);
    return qb.getMany();
  }

  findMovements(
    productId?: string,
    branchName?: string,
    limit?: number,
    offset?: number,
  ) {
    const take = Math.max(1, Math.min(500, Number(limit ?? 200)));
    const skip = Math.max(0, Number(offset ?? 0));
    const where: { productId?: string; branchName?: string } = {};
    if (productId) where.productId = productId;
    if (branchName?.trim()) where.branchName = branchName.trim();
    return this.movementsRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take,
      skip,
    });
  }

  async createMovement(input: CreateMovementInput) {
    const quantity = Math.abs(Number(input.quantity ?? 0));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException('Количество должно быть больше 0');
    }

    const operationType: InventoryOperationType =
      input.operationType ?? (input.type === 'in' ? 'manual_in' : input.type === 'out' ? 'manual_out' : 'adjustment');

    const operationDirectionMap: Record<InventoryOperationType, InventoryMovementType> = {
      sale: 'out',
      purchase: 'in',
      writeoff: 'out',
      return_in: 'in',
      return_out: 'out',
      transfer_in: 'in',
      transfer_out: 'out',
      adjustment: 'adjustment',
      manual_in: 'in',
      manual_out: 'out',
      other: input.type,
    };
    const expectedDirection = operationDirectionMap[operationType];
    if (operationType !== 'other' && expectedDirection !== input.type) {
      throw new BadRequestException('Тип движения не соответствует операции');
    }

    const product = await this.productsRepo.findOne({
      where: { id: input.productId },
    });
    if (!product) {
      throw new NotFoundException('Товар не найден');
    }
    if (
      input.branchName?.trim() &&
      product.branchName &&
      product.branchName !== input.branchName.trim()
    ) {
      throw new BadRequestException('Товар не принадлежит выбранному филиалу');
    }

    const currentStock = Number(product.stockQty ?? 0);
    let newStock = currentStock;

    if (input.type === 'in') {
      newStock = currentStock + quantity;
    } else if (input.type === 'out') {
      newStock = currentStock - quantity;
      if (newStock < 0) {
        throw new BadRequestException(
          `Недостаточно остатка: доступно ${currentStock}, требуется ${quantity}`,
        );
      }
    } else {
      newStock = quantity;
    }

    await this.productsRepo.update(product.id, { stockQty: newStock });

    const movement = this.movementsRepo.create({
      productId: product.id,
      productName: product.name,
      branchName: input.branchName ?? product.branchName,
      type: input.type,
      operationType,
      quantity,
      stockAfter: newStock,
      reason: input.reason,
      actorId: input.actorId,
      actorName: input.actorName,
    });

    return this.movementsRepo.save(movement);
  }
}
