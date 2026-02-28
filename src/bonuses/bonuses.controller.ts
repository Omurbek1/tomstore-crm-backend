import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { BonusEntity } from '../database/entities/bonus.entity';
import { BonusesService } from './bonuses.service';

@Controller('bonuses')
export class BonusesController {
  constructor(private readonly bonusesService: BonusesService) {}

  @Get()
  findAll(
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
  ) {
    const limit = limitRaw !== undefined ? Number(limitRaw) : undefined;
    const offset = offsetRaw !== undefined ? Number(offsetRaw) : undefined;
    return this.bonusesService.findAll(limit, offset);
  }

  @Post()
  create(@Body() body: Partial<BonusEntity>) {
    return this.bonusesService.create(body);
  }
}
