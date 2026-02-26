import { Body, Controller, Get, Post } from '@nestjs/common';
import { ExpenseEntity } from '../database/entities/expense.entity';
import { ExpensesService } from './expenses.service';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  findAll() {
    return this.expensesService.findAll();
  }

  @Post()
  create(@Body() body: Partial<ExpenseEntity>) {
    return this.expensesService.create(body);
  }
}
