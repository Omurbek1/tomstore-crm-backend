import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseEntity } from '../database/entities/expense.entity';
import { UserEntity } from '../database/entities/user.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(ExpenseEntity)
    private readonly expensesRepo: Repository<ExpenseEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  findAll() {
    return this.expensesRepo.find({ order: { createdAt: 'DESC' } });
  }

  async create(payload: Partial<ExpenseEntity>) {
    const manager = payload.managerId
      ? await this.usersRepo.findOne({ where: { id: payload.managerId } })
      : null;

    const expense = this.expensesRepo.create({
      amount: Number(payload.amount ?? 0),
      category: payload.category ?? 'Прочее',
      comment: payload.comment,
      managerId: payload.managerId,
      managerName: payload.managerName ?? manager?.name,
    });

    return this.expensesRepo.save(expense);
  }
}
