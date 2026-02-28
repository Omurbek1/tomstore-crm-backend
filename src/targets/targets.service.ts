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

  private normalizeTargetPayload(payload: Partial<BonusTargetEntity>) {
    const rewardType: 'money' | 'material' =
      payload.rewardType === 'material' ? 'material' : 'money';
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

    if (
      rewardType === 'money' &&
      (!Number.isFinite(rewardAmount) || rewardAmount < 0)
    ) {
      throw new BadRequestException(
        'Для денежной награды сумма должна быть не меньше 0',
      );
    }

    const targetAmount = Number(payload.amount ?? 0);
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      throw new BadRequestException('План продаж должен быть больше 0');
    }

    const startDate = payload.startDate ? new Date(payload.startDate) : undefined;
    const deadline = payload.deadline ? new Date(payload.deadline) : undefined;
    if (startDate && deadline && startDate.getTime() > deadline.getTime()) {
      throw new BadRequestException('Дата начала не может быть позже даты окончания');
    }

    return {
      type: payload.type ?? 'global',
      managerId: payload.managerId,
      amount: targetAmount,
      reward: rewardAmount,
      rewardType,
      rewardText: rewardText || null,
      startDate,
      deadline,
    };
  }

  create(payload: Partial<BonusTargetEntity>) {
    const normalized = this.normalizeTargetPayload(payload);

    const target = this.targetsRepo.create({
      ...normalized,
      rewardIssued: false,
    });

    return this.targetsRepo.save(target);
  }

  async update(id: string, payload: Partial<BonusTargetEntity>) {
    const target = await this.targetsRepo.findOne({ where: { id } });
    if (!target) {
      throw new NotFoundException('Цель не найдена');
    }

    if (target.rewardIssued) {
      throw new BadRequestException('Нельзя редактировать цель после выдачи бонуса');
    }

    const normalized = this.normalizeTargetPayload({
      ...target,
      ...payload,
    });

    target.type = normalized.type;
    target.managerId = normalized.managerId;
    target.amount = normalized.amount;
    target.reward = normalized.reward;
    target.rewardType = normalized.rewardType;
    target.rewardText = normalized.rewardText;
    target.startDate = normalized.startDate;
    target.deadline = normalized.deadline;

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
    if (target.rewardType === 'money' && Number(target.reward || 0) > 0) {
      const reason =
        target.type === 'personal'
          ? `TARGET_BONUS::Бонус за личную цель (${id.slice(0, 8)})`
          : `TARGET_BONUS::Бонус за общую цель (${id.slice(0, 8)})`;

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
