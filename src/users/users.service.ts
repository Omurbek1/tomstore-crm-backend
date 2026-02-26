import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../database/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  private sanitizeUser(user: UserEntity): Omit<UserEntity, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async findAll() {
    const users = await this.usersRepo.find({ order: { createdAt: 'DESC' } });
    return users.map((user) => this.sanitizeUser(user));
  }

  async update(id: string, payload: Partial<UserEntity>) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Сотрудник не найден');
    }

    await this.usersRepo.update(id, payload);
    const updated = await this.usersRepo.findOneByOrFail({ id });
    return this.sanitizeUser(updated);
  }

  async remove(id: string): Promise<{ success: true }> {
    await this.usersRepo.delete(id);
    return { success: true };
  }
}
