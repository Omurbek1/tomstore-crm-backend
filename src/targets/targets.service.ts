import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BonusTargetEntity } from '../database/entities/bonus-target.entity';

@Injectable()
export class TargetsService {
  constructor(
    @InjectRepository(BonusTargetEntity)
    private readonly targetsRepo: Repository<BonusTargetEntity>,
  ) {}

  findAll() {
    return this.targetsRepo.find({ order: { createdAt: 'DESC' } });
  }

  create(payload: Partial<BonusTargetEntity>) {
    const target = this.targetsRepo.create({
      type: payload.type ?? 'global',
      managerId: payload.managerId,
      amount: Number(payload.amount ?? 0),
      reward: Number(payload.reward ?? 0),
      deadline: payload.deadline,
    });

    return this.targetsRepo.save(target);
  }

  async remove(id: string): Promise<{ success: true }> {
    await this.targetsRepo.delete(id);
    return { success: true };
  }
}
