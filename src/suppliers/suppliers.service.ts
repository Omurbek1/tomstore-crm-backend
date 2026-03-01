import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplierEntity } from '../database/entities/supplier.entity';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(SupplierEntity)
    private readonly suppliersRepo: Repository<SupplierEntity>,
  ) {}

  findAll(limit?: number, offset?: number) {
    const take = Math.max(1, Math.min(500, Number(limit ?? 200)));
    const skip = Math.max(0, Number(offset ?? 0));
    return this.suppliersRepo.find({
      order: { createdAt: 'DESC' },
      take,
      skip,
    });
  }

  create(payload: Partial<SupplierEntity>) {
    const imageUrls = Array.isArray(payload.imageUrls)
      ? payload.imageUrls
          .map((value) => String(value || '').trim())
          .filter(Boolean)
      : payload.imageUrl
        ? [payload.imageUrl]
        : [];
    const supplier = this.suppliersRepo.create({
      name: payload.name ?? '',
      contacts: payload.contacts,
      address: payload.address,
      imageUrl: imageUrls[0] ?? payload.imageUrl,
      imageUrls,
      videoUrl: payload.videoUrl,
    });
    return this.suppliersRepo.save(supplier);
  }

  async update(id: string, payload: Partial<SupplierEntity>) {
    const found = await this.suppliersRepo.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException('Поставщик не найден');
    }

    const patch = { ...payload };
    if (Array.isArray(payload.imageUrls)) {
      patch.imageUrls = payload.imageUrls
        .map((value) => String(value || '').trim())
        .filter(Boolean);
      patch.imageUrl = patch.imageUrls[0];
    } else if (payload.imageUrl && !payload.imageUrls) {
      patch.imageUrls = [payload.imageUrl];
    }

    await this.suppliersRepo.update(id, patch);
    return this.suppliersRepo.findOneByOrFail({ id });
  }

  async remove(id: string): Promise<{ success: true }> {
    await this.suppliersRepo.delete(id);
    return { success: true };
  }
}
