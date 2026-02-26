import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { BonusTargetEntity } from '../database/entities/bonus-target.entity';
import { TargetsService } from './targets.service';

@Controller('targets')
export class TargetsController {
  constructor(private readonly targetsService: TargetsService) {}

  @Get()
  findAll() {
    return this.targetsService.findAll();
  }

  @Post()
  create(@Body() body: Partial<BonusTargetEntity>) {
    return this.targetsService.create(body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.targetsService.remove(id);
  }
}
