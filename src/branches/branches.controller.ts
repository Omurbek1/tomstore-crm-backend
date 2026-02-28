import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { BranchEntity } from '../database/entities/branch.entity';
import { BranchesService } from './branches.service';

@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  findAll(
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
  ) {
    const limit = limitRaw !== undefined ? Number(limitRaw) : undefined;
    const offset = offsetRaw !== undefined ? Number(offsetRaw) : undefined;
    return this.branchesService.findAll(limit, offset);
  }

  @Post()
  create(@Body() body: Partial<BranchEntity>) {
    return this.branchesService.create(body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.branchesService.remove(id);
  }
}
