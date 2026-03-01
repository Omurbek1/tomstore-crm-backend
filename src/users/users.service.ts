import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserEntity } from '../database/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private sanitizeUser(user: UserEntity): Omit<UserEntity, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;
    return safeUser;
  }

  private normalizeKgPhone(raw?: string): string | undefined {
    if (!raw) return undefined;
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 9) return `+996${digits}`;
    if (digits.length === 12 && digits.startsWith('996')) return `+${digits}`;
    throw new BadRequestException(
      'Телефон должен быть в формате +996XXXXXXXXX',
    );
  }

  private normalizeRoles(
    rawRole?: string,
    rawRoles?: string[],
  ): Array<'superadmin' | 'admin' | 'manager' | 'storekeeper' | 'cashier'> {
    const allowed = new Set([
      'superadmin',
      'admin',
      'manager',
      'storekeeper',
      'cashier',
    ]);
    const source = [
      ...(Array.isArray(rawRoles) ? rawRoles : []),
      rawRole ?? 'manager',
    ]
      .map((r) => String(r || '').trim())
      .filter(Boolean);
    const unique = Array.from(new Set(source)).filter((r) => allowed.has(r));
    if (unique.length === 0) return ['manager'];
    return unique as Array<
      'superadmin' | 'admin' | 'manager' | 'storekeeper' | 'cashier'
    >;
  }

  private normalizeManagedBranches(
    payload: Partial<UserEntity>,
  ): Partial<UserEntity> {
    const result: Partial<UserEntity> = {};

    if (payload.managedBranchIds !== undefined) {
      const ids = Array.isArray(payload.managedBranchIds)
        ? payload.managedBranchIds
            .map((value) => String(value || '').trim())
            .filter(Boolean)
        : [];
      result.managedBranchIds = ids.length > 0 ? Array.from(new Set(ids)) : [];
    }

    if (payload.managedBranchNames !== undefined) {
      const names = Array.isArray(payload.managedBranchNames)
        ? payload.managedBranchNames
            .map((value) => String(value || '').trim())
            .filter(Boolean)
        : [];
      result.managedBranchNames =
        names.length > 0 ? Array.from(new Set(names)) : [];
    }

    return result;
  }

  async findAll(limit?: number, offset?: number) {
    const take = Math.max(1, Math.min(500, Number(limit ?? 200)));
    const skip = Math.max(0, Number(offset ?? 0));
    const users = await this.usersRepo.find({
      where: { deleted: false },
      order: { createdAt: 'DESC' },
      take,
      skip,
    });
    return users.map((user) => this.sanitizeUser(user));
  }

  async update(id: string, payload: Partial<UserEntity>) {
    const user = await this.usersRepo.findOne({
      where: { id, deleted: false },
    });
    if (!user) {
      throw new NotFoundException('Сотрудник не найден');
    }

    if (payload.login && payload.login !== user.login) {
      const duplicate = await this.usersRepo
        .createQueryBuilder('u')
        .where('u.login = :login', { login: payload.login })
        .andWhere('u.id != :id', { id })
        .getOne();
      if (duplicate) {
        throw new BadRequestException('Логин уже занят');
      }
    }

    const normalizedPayload: Partial<UserEntity> = {
      ...payload,
      phone:
        payload.phone === undefined
          ? undefined
          : this.normalizeKgPhone(payload.phone),
      roles:
        payload.role !== undefined || payload.roles !== undefined
          ? this.normalizeRoles(payload.role, payload.roles)
          : undefined,
      salaryType:
        payload.salaryType !== undefined
          ? payload.salaryType === 'fixed'
            ? 'fixed'
            : 'commission'
          : undefined,
      fixedMonthlySalary:
        payload.fixedMonthlySalary !== undefined
          ? Math.max(0, Number(payload.fixedMonthlySalary || 0))
          : undefined,
      canManageProducts:
        payload.canManageProducts !== undefined
          ? Boolean(payload.canManageProducts)
          : undefined,
      birthYear:
        payload.birthDate !== undefined && payload.birthDate !== null
          ? new Date(payload.birthDate).getUTCFullYear()
          : payload.birthYear,
      branchId: payload.branchId,
      branchName: payload.branchName,
      ...this.normalizeManagedBranches(payload),
    };

    if (
      normalizedPayload.roles &&
      normalizedPayload.roles.includes('cashier') &&
      normalizedPayload.salaryType !== 'fixed'
    ) {
      normalizedPayload.salaryType = 'fixed';
    }
    if (
      normalizedPayload.roles &&
      payload.role === undefined &&
      normalizedPayload.roles.length > 0
    ) {
      normalizedPayload.role = normalizedPayload.roles[0] as UserEntity['role'];
    }
    if (
      normalizedPayload.roles &&
      !normalizedPayload.roles.includes('storekeeper')
    ) {
      normalizedPayload.canManageProducts = false;
    }
    if (
      normalizedPayload.roles &&
      !normalizedPayload.roles.includes('superadmin')
    ) {
      normalizedPayload.managedBranchIds = undefined;
      normalizedPayload.managedBranchNames = undefined;
    }

    await this.usersRepo.update(id, normalizedPayload);
    const updated = await this.usersRepo.findOneByOrFail({ id });
    return this.sanitizeUser(updated);
  }

  async remove(id: string): Promise<{ success: true; deleted: true }> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Сотрудник не найден');
    }
    if (
      user.role === 'admin' ||
      user.role === 'superadmin' ||
      user.roles?.includes('admin') ||
      user.roles?.includes('superadmin')
    ) {
      throw new BadRequestException('Администратора/владельца удалять нельзя');
    }

    if (!user.deleted) {
      await this.usersRepo.update(id, { deleted: true });
    }
    return { success: true, deleted: true };
  }

  async findDeleted(limit?: number, offset?: number) {
    const take = Math.max(1, Math.min(500, Number(limit ?? 200)));
    const skip = Math.max(0, Number(offset ?? 0));
    const users = await this.usersRepo.find({
      where: { deleted: true },
      order: { updatedAt: 'DESC' },
      take,
      skip,
    });
    return users.map((user) => this.sanitizeUser(user));
  }

  async restore(id: string): Promise<{ success: true; restored: true }> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Сотрудник не найден');
    }
    if (
      user.role === 'admin' ||
      user.role === 'superadmin' ||
      user.roles?.includes('admin') ||
      user.roles?.includes('superadmin')
    ) {
      throw new BadRequestException(
        'Администратор/владелец не подлежит восстановлению',
      );
    }

    if (user.deleted) {
      await this.usersRepo.update(id, { deleted: false });
    }
    return { success: true, restored: true };
  }

  async getPayoutBalance(id: string) {
    const user = await this.usersRepo.findOne({ where: { id, deleted: false } });
    if (!user) {
      throw new NotFoundException('Сотрудник не найден');
    }

    const [row] = await this.dataSource.query(
      `
      SELECT
        COALESCE((SELECT SUM(s."managerEarnings") FROM sales s WHERE s."managerId" = $1), 0) AS "earned",
        COALESCE((SELECT SUM(s."managerEarnings") FROM sales s WHERE s."managerId" = $1 AND s."createdAt" >= date_trunc('month', now())), 0) AS "earnedMonth",
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
        COALESCE((SELECT SUM(e."amount") FROM expenses e WHERE e."managerId" = $1 AND e."category" IN ('Аванс', 'Штраф')), 0) AS "advances",
        COALESCE((SELECT SUM(e."amount") FROM expenses e WHERE e."managerId" = $1 AND e."category" IN ('Аванс', 'Штраф') AND e."createdAt" >= date_trunc('month', now())), 0) AS "advancesMonth",
        COALESCE((SELECT SUM(e."amount") FROM expenses e WHERE e."managerId" = $1 AND e."category" NOT IN ('Аванс', 'Штраф')), 0) AS "managerExpenses",
        COALESCE((SELECT SUM(e."amount") FROM expenses e WHERE e."managerId" = $1 AND e."category" NOT IN ('Аванс', 'Штраф') AND e."createdAt" >= date_trunc('month', now())), 0) AS "managerExpensesMonth"
      `,
      [id],
    );

    const isFixed = user.salaryType === 'fixed';
    const earned = Number((isFixed ? row?.earnedMonth : row?.earned) ?? 0);
    const bonuses = Number(
      (isFixed ? row?.salaryPaidMonth : row?.salaryPaid) ?? 0,
    );
    const advances = Number((isFixed ? row?.advancesMonth : row?.advances) ?? 0);
    const managerExpenses = Number(
      (isFixed ? row?.managerExpensesMonth : row?.managerExpenses) ?? 0,
    );
    const fixedBase = isFixed ? Number(user.fixedMonthlySalary ?? 0) : 0;
    const available = fixedBase + earned - bonuses - advances - managerExpenses;

    return {
      managerId: id,
      salaryType: user.salaryType,
      fixedMonthlySalary: Number(user.fixedMonthlySalary ?? 0),
      earned,
      bonuses,
      advances,
      managerExpenses,
      available,
      maxPayable: Math.max(0, available),
      debt: Math.min(0, available),
    };
  }
}
