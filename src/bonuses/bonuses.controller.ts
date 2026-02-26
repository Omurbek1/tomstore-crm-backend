import { Body, Controller, Get, Post } from '@nestjs/common';
import { BonusEntity } from '../database/entities/bonus.entity';
import { BonusesService } from './bonuses.service';

@Controller('bonuses')
export class BonusesController {
  constructor(private readonly bonusesService: BonusesService) {}

  @Get()
  findAll() {
    return this.bonusesService.findAll();
  }

  @Post()
  create(@Body() body: Partial<BonusEntity>) {
    return this.bonusesService.create(body);
  }
}
