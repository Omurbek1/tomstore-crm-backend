import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BonusEntity } from '../database/entities/bonus.entity';
import { UserEntity } from '../database/entities/user.entity';

@Injectable()
export class BonusesService {
  constructor(
    @InjectRepository(BonusEntity)
    private readonly bonusesRepo: Repository<BonusEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(limit?: number, offset?: number) {
    const take = Math.max(1, Math.min(500, Number(limit ?? 200)));
    const skip = Math.max(0, Number(offset ?? 0));
    return this.bonusesRepo.find({
      order: { createdAt: 'DESC' },
      take,
      skip,
    });
  }

  async create(payload: Partial<BonusEntity>) {
    if (!payload.managerId) {
      throw new BadRequestException('managerId is required for bonus payout');
    }

    const amount = Number(payload.amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('amount must be greater than 0');
    }

    const rawReason = String(payload.reason || '').trim();
    const isCompanyBonus =
      rawReason.startsWith('BONUS::') ||
      rawReason.startsWith('TARGET_BONUS::');
    const reason = rawReason
      ? rawReason
      : isCompanyBonus
        ? 'BONUS::Бонус от компании'
        : 'SALARY::Выплата ЗП';
    const normalizedReason =
      !isCompanyBonus &&
      !reason.startsWith('SALARY::') &&
      !reason.startsWith('BONUS::') &&
      !reason.startsWith('TARGET_BONUS::')
        ? `SALARY::${reason}`
        : reason;

    let nextBalance: number | null = null;
    if (!isCompanyBonus) {
      const balance = await this.getManagerPayoutBalance(payload.managerId);
      nextBalance = balance.currentBalance - amount;
      if (nextBalance < 0) {
        throw new BadRequestException(
          `Payout exceeds available limit. Max payable: ${Math.max(0, balance.currentBalance).toFixed(2)}, debt after payout: ${Math.abs(nextBalance).toFixed(2)}`,
        );
      }
    }

    const manager = payload.managerId
      ? await this.usersRepo.findOne({ where: { id: payload.managerId } })
      : null;

    const bonus = this.bonusesRepo.create({
      managerId: payload.managerId,
      managerName: payload.managerName ?? manager?.name ?? 'Unknown',
      amount,
      reason: normalizedReason,
      addedBy: payload.addedBy,
    });

    const saved = await this.bonusesRepo.save(bonus);
    return {
      ...saved,
      maxPayable: nextBalance === null ? null : Math.max(0, nextBalance),
      debt: nextBalance === null ? 0 : Math.max(0, -nextBalance),
      currentBalance: nextBalance,
    };
  }

  private async getManagerPayoutBalance(managerId: string) {
    const user = await this.usersRepo.findOne({ where: { id: managerId } });
    const [row] = await this.dataSource.query(
      `
      SELECT
        COALESCE((SELECT SUM(s."managerEarnings") FROM sales s WHERE s."managerId" = $1), 0) AS "salesEarnings",
        COALESCE((SELECT SUM(s."managerEarnings") FROM sales s WHERE s."managerId" = $1 AND s."createdAt" >= date_trunc('month', now())), 0) AS "salesEarningsMonth",
        COALESCE((
          SELECT SUM(b."amount")
          FROM bonuses b
          WHERE b."managerId" = $1
            AND (
              b."reason" LIKE 'SALARY::%'
              OR (
                b."reason" NOT LIKE 'BONUS::%'
                AND b."reason" NOT LIKE 'TARGET_BONUS::%'
              )
            )
        ), 0) AS "salaryPaid",
        COALESCE((
          SELECT SUM(b."amount")
          FROM bonuses b
          WHERE b."managerId" = $1
            AND b."createdAt" >= date_trunc('month', now())
            AND (
              b."reason" LIKE 'SALARY::%'
              OR (
                b."reason" NOT LIKE 'BONUS::%'
                AND b."reason" NOT LIKE 'TARGET_BONUS::%'
              )
            )
        ), 0) AS "salaryPaidMonth",
        COALESCE((SELECT SUM(e."amount") FROM expenses e WHERE e."managerId" = $1 AND e."category" IN ('Аванс', 'Штраф')), 0) AS "advancesAndPenaltiesPaid",
        COALESCE((SELECT SUM(e."amount") FROM expenses e WHERE e."managerId" = $1 AND e."category" IN ('Аванс', 'Штраф') AND e."createdAt" >= date_trunc('month', now())), 0) AS "advancesAndPenaltiesPaidMonth"
      `,
      [managerId],
    );

    const isFixed = user?.salaryType === 'fixed';
    const salesEarnings = Number(
      (isFixed ? row?.salesEarningsMonth : row?.salesEarnings) ?? 0,
    );
    const bonusesPaid = Number(
      (isFixed ? row?.salaryPaidMonth : row?.salaryPaid) ?? 0,
    );
    const advancesAndPenaltiesPaid = Number(
      (isFixed
        ? row?.advancesAndPenaltiesPaidMonth
        : row?.advancesAndPenaltiesPaid) ?? 0,
    );
    const fixedBase = isFixed ? Number(user?.fixedMonthlySalary ?? 0) : 0;
    const currentBalance =
      fixedBase + salesEarnings - bonusesPaid - advancesAndPenaltiesPaid;

    return {
      fixedBase,
      salesEarnings,
      bonusesPaid,
      advancesAndPenaltiesPaid,
      currentBalance,
    };
  }
}
