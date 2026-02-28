import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BonusEntity } from '../database/entities/bonus.entity';
import { BonusTargetEntity } from '../database/entities/bonus-target.entity';
import { SaleEntity } from '../database/entities/sale.entity';
import { UserEntity } from '../database/entities/user.entity';

@Injectable()
export class TargetsService {
  constructor(
    @InjectRepository(BonusTargetEntity)
    private readonly targetsRepo: Repository<BonusTargetEntity>,
    @InjectRepository(BonusEntity)
    private readonly bonusesRepo: Repository<BonusEntity>,
    @InjectRepository(SaleEntity)
    private readonly salesRepo: Repository<SaleEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  findAll(limit?: number, offset?: number) {
    const take = Math.max(1, Math.min(500, Number(limit ?? 200)));
    const skip = Math.max(0, Number(offset ?? 0));
    return this.targetsRepo.find({
      order: { createdAt: 'DESC' },
      take,
      skip,
    });
  }

  create(payload: Partial<BonusTargetEntity>) {
    const rewardType = payload.rewardType === 'material' ? 'material' : 'money';
    const rewardText =
      rewardType === 'material'
        ? String(payload.rewardText || '').trim()
        : undefined;
    const rewardAmount =
      rewardType === 'money' ? Number(payload.reward ?? 0) : 0;

    if (rewardType === 'material' && !rewardText) {
      throw new BadRequestException(
        'Для материальной награды укажите текст (например: ноутбук, туризм)',
      );
    }
    if (rewardType === 'money' && (!Number.isFinite(rewardAmount) || rewardAmount <= 0)) {
      throw new BadRequestException('Для денежной награды сумма должна быть больше 0');
    }

    const target = this.targetsRepo.create({
      type: payload.type ?? 'global',
      managerId: payload.managerId,
      amount: Number(payload.amount ?? 0),
      reward: rewardAmount,
      rewardType,
      rewardText: rewardText || null,
      deadline: payload.deadline,
      rewardIssued: false,
    });

    return this.targetsRepo.save(target);
  }

  async issueReward(id: string, payload?: { approvedBy?: string }) {
    const target = await this.targetsRepo.findOne({ where: { id } });
    if (!target) {
      throw new NotFoundException('Цель не найдена');
    }
    if (target.rewardIssued) {
      throw new BadRequestException('Бонус по этой цели уже выдан');
    }

    const currentIncome = await this.getTargetCurrentIncome(target);
    if (currentIncome < Number(target.amount || 0)) {
      throw new BadRequestException(
        `Цель не достигнута: ${currentIncome.toFixed(2)} / ${Number(target.amount || 0).toFixed(2)}`,
      );
    }

    const manager =
      target.type === 'personal' && target.managerId
        ? await this.usersRepo.findOne({ where: { id: target.managerId } })
        : null;
    const managerName =
      target.type === 'personal'
        ? manager?.name || 'Сотрудник'
        : 'Отдел продаж';

    let savedBonus: BonusEntity | null = null;
    if (target.rewardType === 'money') {
      const reason =
        target.type === 'personal'
          ? `Бонус за личную цель (${id.slice(0, 8)})`
          : `Бонус за общую цель (${id.slice(0, 8)})`;

      const bonus = this.bonusesRepo.create({
        managerId: target.type === 'personal' ? target.managerId : undefined,
        managerName,
        amount: Number(target.reward || 0),
        reason,
        addedBy: payload?.approvedBy || 'Администратор',
      });
      savedBonus = await this.bonusesRepo.save(bonus);
    }

    target.rewardIssued = true;
    target.rewardIssuedAt = new Date();
    target.rewardApprovedBy = payload?.approvedBy || 'Администратор';
    const updatedTarget = await this.targetsRepo.save(target);

    return {
      target: updatedTarget,
      bonus: savedBonus,
      rewardAction:
        target.rewardType === 'money'
          ? 'money_bonus_issued'
          : 'material_reward_issued',
      progress: {
        currentIncome,
        targetAmount: Number(target.amount || 0),
      },
    };
  }

  private async getTargetCurrentIncome(target: BonusTargetEntity) {
    if (target.type === 'personal' && target.managerId) {
      const row = await this.salesRepo
        .createQueryBuilder('s')
        .select('COALESCE(SUM(s.total), 0)', 'sum')
        .where('s.managerId = :managerId', { managerId: target.managerId })
        .getRawOne<{ sum: string }>();
      return Number(row?.sum ?? 0);
    }

    const row = await this.salesRepo
      .createQueryBuilder('s')
      .select('COALESCE(SUM(s.total), 0)', 'sum')
      .getRawOne<{ sum: string }>();
    return Number(row?.sum ?? 0);
  }

  async remove(id: string): Promise<{ success: true }> {
    await this.targetsRepo.delete(id);
    return { success: true };
  }
}
