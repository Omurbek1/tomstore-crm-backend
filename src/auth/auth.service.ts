import {
  BadRequestException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../database/entities/user.entity';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.usersRepo.count({ where: { deleted: false } });
    if (count > 0) return;

    await this.usersRepo.save([
      this.usersRepo.create({
        login: 'superadmin',
        name: 'superadmin',
        password: 'super123',
        role: 'superadmin',
        roles: ['superadmin', 'admin'],
        salaryType: 'fixed',
        fixedMonthlySalary: 0,
        canManageProducts: true,
        theme: 'light',
        phone: '+996700000000',
        address: 'Бишкек',
        branchName: 'Центральный',
        managedBranchNames: ['Центральный'],
        birthYear: 1988,
        birthDate: new Date('1988-01-01T00:00:00Z'),
        deleted: false,
      }),
      this.usersRepo.create({
        login: 'admin',
        name: 'admin',
        password: 'admin123',
        role: 'admin',
        roles: ['admin'],
        salaryType: 'fixed',
        fixedMonthlySalary: 0,
        canManageProducts: true,
        theme: 'light',
        phone: '+996700000001',
        address: 'Бишкек',
        branchName: 'Центральный',
        birthYear: 1990,
        birthDate: new Date('1990-01-01T00:00:00Z'),
        deleted: false,
      }),
      this.usersRepo.create({
        login: 'manager',
        name: 'manager',
        password: 'manager123',
        role: 'manager',
        roles: ['manager'],
        salaryType: 'commission',
        fixedMonthlySalary: 0,
        canManageProducts: false,
        theme: 'light',
        phone: '+996700000002',
        address: 'Бишкек',
        branchName: 'Центральный',
        birthYear: 1998,
        birthDate: new Date('1998-01-01T00:00:00Z'),
        deleted: false,
      }),
      this.usersRepo.create({
        login: 'storekeeper',
        name: 'storekeeper',
        password: 'store123',
        role: 'storekeeper',
        roles: ['storekeeper'],
        salaryType: 'fixed',
        fixedMonthlySalary: 0,
        canManageProducts: false,
        theme: 'light',
        phone: '+996700000003',
        address: 'Бишкек',
        branchName: 'Центральный',
        birthYear: 1995,
        birthDate: new Date('1995-01-01T00:00:00Z'),
        deleted: false,
      }),
    ]);
  }

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
    throw new BadRequestException('Телефон должен быть в формате +996XXXXXXXXX');
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

  async login(loginOrName: string, password: string) {
    if (!loginOrName) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }
    const user = await this.usersRepo.findOne({
      where: [
        { login: loginOrName, deleted: false },
        { name: loginOrName, deleted: false },
      ],
    });
    if (!user || user.password !== password) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    return {
      accessToken: `token-${user.id}`,
      user: this.sanitizeUser(user),
    };
  }

  async register(payload: Partial<UserEntity>) {
    const login = (payload.login ?? payload.name ?? '').trim();
    if (!login) {
      throw new BadRequestException('Логин обязателен');
    }

    const existingByLogin = await this.usersRepo.findOne({
      where: { login },
    });
    if (existingByLogin) {
      throw new BadRequestException('Логин уже занят');
    }

    const birthDateValue = payload.birthDate ? new Date(payload.birthDate) : undefined;
    const derivedBirthYear = birthDateValue ? birthDateValue.getUTCFullYear() : undefined;

    const normalizedRoles = this.normalizeRoles(payload.role, payload.roles);
    const managedBranches = this.normalizeManagedBranches(payload);
    const isSuperAdmin = normalizedRoles.includes('superadmin');
    const salaryType =
      payload.salaryType === 'fixed' || normalizedRoles.includes('cashier')
        ? 'fixed'
        : 'commission';

    const user = this.usersRepo.create({
      login,
      name: payload.name ?? '',
      password: payload.password ?? '123456',
      role: (payload.role ?? normalizedRoles[0] ?? 'manager') as UserEntity['role'],
      roles: normalizedRoles,
      salaryType,
      fixedMonthlySalary: Math.max(0, Number(payload.fixedMonthlySalary ?? 0)),
      canManageProducts: normalizedRoles.includes('storekeeper')
        ? Boolean(payload.canManageProducts)
        : false,
      theme: payload.theme,
      phone: this.normalizeKgPhone(payload.phone),
      address: payload.address,
      birthYear: payload.birthYear ?? derivedBirthYear,
      birthDate: birthDateValue ?? payload.birthDate,
      photoUrl: payload.photoUrl,
      branchId: payload.branchId,
      branchName: payload.branchName,
      managedBranchIds: isSuperAdmin
        ? managedBranches.managedBranchIds
        : undefined,
      managedBranchNames: isSuperAdmin
        ? managedBranches.managedBranchNames
        : undefined,
      deleted: false,
    });

    const created = await this.usersRepo.save(user);
    return this.sanitizeUser(created);
  }
}
