import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchEntity } from '../database/entities/branch.entity';

@Injectable()
export class BranchesService implements OnModuleInit {
  constructor(
    @InjectRepository(BranchEntity)
    private readonly branchesRepo: Repository<BranchEntity>,
  ) {}

  async onModuleInit() {
    const count = await this.branchesRepo.count();
    if (count === 0) {
      await this.branchesRepo.save(
        this.branchesRepo.create({ name: 'Центральный' }),
      );
    }
  }

  findAll(limit?: number, offset?: number) {
    const take = Math.max(1, Math.min(500, Number(limit ?? 200)));
    const skip = Math.max(0, Number(offset ?? 0));
    return this.branchesRepo.find({
      order: { createdAt: 'ASC' },
      take,
      skip,
    });
  }

  async create(payload: Partial<BranchEntity>) {
    const name = String(payload.name || '').trim();
    if (!name) {
      throw new BadRequestException('Название филиала обязательно');
    }

    const exists = await this.branchesRepo.findOne({ where: { name } });
    if (exists) {
      throw new BadRequestException('Филиал с таким названием уже существует');
    }

    const branch = this.branchesRepo.create({ name });
    return this.branchesRepo.save(branch);
  }

  async remove(id: string): Promise<{ success: true }> {
    const found = await this.branchesRepo.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException('Филиал не найден');
    }
    await this.branchesRepo.delete(id);
    return { success: true };
  }
}
