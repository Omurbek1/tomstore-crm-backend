import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ExpenseEntity } from '../database/entities/expense.entity';
import { ExpensesService } from './expenses.service';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  findAll(
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
  ) {
    const limit = limitRaw !== undefined ? Number(limitRaw) : undefined;
    const offset = offsetRaw !== undefined ? Number(offsetRaw) : undefined;
    return this.expensesService.findAll(limit, offset);
  }

  @Post()
  create(@Body() body: Partial<ExpenseEntity>) {
    return this.expensesService.create(body);
  }
}
