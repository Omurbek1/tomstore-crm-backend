import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { SaleEntity } from '../database/entities/sale.entity';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  findAll() {
    return this.salesService.findAll();
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
