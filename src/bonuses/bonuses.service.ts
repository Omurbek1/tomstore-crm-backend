import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BonusEntity } from '../database/entities/bonus.entity';
import { UserEntity } from '../database/entities/user.entity';

@Injectable()
export class BonusesService {
  constructor(
    @InjectRepository(BonusEntity)
    private readonly bonusesRepo: Repository<BonusEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  findAll() {
    return this.bonusesRepo.find({ order: { createdAt: 'DESC' } });
  }

  async create(payload: Partial<BonusEntity>) {
    const manager = payload.managerId
      ? await this.usersRepo.findOne({ where: { id: payload.managerId } })
      : null;

    const bonus = this.bonusesRepo.create({
      managerId: payload.managerId,
      managerName: payload.managerName ?? manager?.name ?? 'Unknown',
      amount: Number(payload.amount ?? 0),
      reason: payload.reason ?? 'Без комментария',
      addedBy: payload.addedBy,
    });

    return this.bonusesRepo.save(bonus);
  }
}
