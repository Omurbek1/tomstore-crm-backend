import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../database/entities/product.entity';
import { SaleEntity } from '../database/entities/sale.entity';
import { UserEntity } from '../database/entities/user.entity';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(SaleEntity)
    private readonly salesRepo: Repository<SaleEntity>,
    @InjectRepository(ProductEntity)
    private readonly productsRepo: Repository<ProductEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  findAll() {
    return this.salesRepo.find({ order: { createdAt: 'DESC' } });
  }

  async create(payload: Partial<SaleEntity>) {
    const product = payload.productId
      ? await this.productsRepo.findOne({ where: { id: payload.productId } })
      : null;
    const manager = payload.managerId
      ? await this.usersRepo.findOne({ where: { id: payload.managerId } })
      : null;

    const quantity = Number(payload.quantity ?? 1);
    const price = Number(payload.price ?? product?.sellingPrice ?? 0);

    const sale = this.salesRepo.create({
      clientName: payload.clientName ?? '',
      clientPhone: payload.clientPhone,
      clientAddress: payload.clientAddress,
      productId: payload.productId ?? '',
      productName: payload.productName ?? product?.name ?? '',
      supplierSnapshot: payload.supplierSnapshot ?? product?.supplier,
      costPriceSnapshot: Number(payload.costPriceSnapshot ?? product?.costPrice ?? 0),
      price,
      quantity,
      total: Number(payload.total ?? price * quantity),
      branch: payload.branch ?? 'Центральный',
      paymentType: payload.paymentType ?? 'cash',
      installmentMonths: payload.installmentMonths,
      managerEarnings: Number(payload.managerEarnings ?? product?.managerEarnings ?? 0),
      potentialEarnings: payload.potentialEarnings,
      baseManagerEarnings: payload.baseManagerEarnings,
      deliveryStatus: payload.deliveryStatus ?? 'reserved',
      saleType: payload.saleType ?? 'office',
      managerId: payload.managerId,
      managerName: payload.managerName ?? manager?.name ?? 'Unknown',
      bookingDeadline: payload.bookingDeadline ?? null,
      bookingDeposit:
        payload.bookingDeposit === undefined ? null : Number(payload.bookingDeposit),
      manualDate: payload.manualDate ?? null,
      updatedBy: payload.updatedBy,
      deliveryCost:
        payload.deliveryCost === undefined ? 0 : Number(payload.deliveryCost),
    });

    return this.salesRepo.save(sale);
  }

  async update(id: string, payload: Partial<SaleEntity>) {
    const found = await this.salesRepo.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException('Продажа не найдена');
    }

    await this.salesRepo.update(id, payload);
    return this.salesRepo.findOneByOrFail({ id });
  }

  async remove(id: string): Promise<{ success: true }> {
    await this.salesRepo.delete(id);
    return { success: true };
  }
}
