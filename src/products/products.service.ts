import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../database/entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productsRepo: Repository<ProductEntity>,
  ) {}

  findAll() {
    return this.productsRepo.find({ order: { createdAt: 'DESC' } });
  }

  create(payload: Partial<ProductEntity>) {
    const product = this.productsRepo.create({
      name: payload.name ?? '',
      category: payload.category ?? 'Прочее',
      costPrice: Number(payload.costPrice ?? 0),
      sellingPrice: Number(payload.sellingPrice ?? 0),
      supplier: payload.supplier,
      managerEarnings: payload.managerEarnings,
    });
    return this.productsRepo.save(product);
  }

  async update(id: string, payload: Partial<ProductEntity>) {
    const found = await this.productsRepo.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException('Товар не найден');
    }

    await this.productsRepo.update(id, payload);
    return this.productsRepo.findOneByOrFail({ id });
  }

  async remove(id: string): Promise<{ success: true }> {
    await this.productsRepo.delete(id);
    return { success: true };
  }
}
