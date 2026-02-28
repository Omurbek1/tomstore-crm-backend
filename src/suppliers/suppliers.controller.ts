import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { SupplierEntity } from '../database/entities/supplier.entity';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  findAll(
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
  ) {
    const limit = limitRaw !== undefined ? Number(limitRaw) : undefined;
    const offset = offsetRaw !== undefined ? Number(offsetRaw) : undefined;
    return this.suppliersService.findAll(limit, offset);
  }

  @Post()
  create(@Body() body: Partial<SupplierEntity>) {
    return this.suppliersService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<SupplierEntity>) {
    return this.suppliersService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }
}
