import {
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
    const count = await this.usersRepo.count();
    if (count > 0) return;

    await this.usersRepo.save([
      this.usersRepo.create({
        name: 'admin',
        password: 'admin123',
        role: 'admin',
        theme: 'light',
      }),
      this.usersRepo.create({
        name: 'manager',
        password: 'manager123',
        role: 'manager',
        theme: 'light',
      }),
    ]);
  }

  private sanitizeUser(user: UserEntity): Omit<UserEntity, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async login(name: string, password: string) {
    const user = await this.usersRepo.findOne({ where: { name } });
    if (!user || user.password !== password) {
      throw new UnauthorizedException('Неверное имя или пароль');
    }

    return {
      accessToken: `token-${user.id}`,
      user: this.sanitizeUser(user),
    };
  }

  async register(payload: Partial<UserEntity>) {
    const user = this.usersRepo.create({
      name: payload.name ?? '',
      password: payload.password ?? '123456',
      role: payload.role ?? 'manager',
      theme: payload.theme,
    });

    const created = await this.usersRepo.save(user);
    return this.sanitizeUser(created);
  }
}
