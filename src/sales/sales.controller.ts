import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { SaleEntity } from '../database/entities/sale.entity';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  findAll(
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
    @Query('all') allRaw?: string,
    @Query('managerId') managerId?: string,
    @Query('cashierId') cashierId?: string,
    @Query('branch') branch?: string,
    @Query('shiftId') shiftId?: string,
    @Query('paymentType') paymentType?: string,
    @Query('q') q?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const limit = limitRaw !== undefined ? Number(limitRaw) : undefined;
    const offset = offsetRaw !== undefined ? Number(offsetRaw) : undefined;
    const all = allRaw === '1' || allRaw === 'true';
    return this.salesService.findAll({
      limit,
      offset,
      all,
      managerId: managerId || cashierId,
      branch,
      shiftId,
      paymentType,
      q,
      dateFrom,
      dateTo,
    });
  }

  @Post()
  create(@Body() body: Partial<SaleEntity>) {
    return this.salesService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<SaleEntity>) {
    return this.salesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.salesService.remove(id);
  }
}
