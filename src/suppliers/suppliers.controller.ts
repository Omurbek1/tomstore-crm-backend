import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { SupplierEntity } from '../database/entities/supplier.entity';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  findAll() {
    return this.suppliersService.findAll();
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
