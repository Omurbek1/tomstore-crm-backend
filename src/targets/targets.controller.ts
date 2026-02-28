import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { BonusTargetEntity } from '../database/entities/bonus-target.entity';
import { TargetsService } from './targets.service';

@Controller('targets')
export class TargetsController {
  constructor(private readonly targetsService: TargetsService) {}

  @Get()
  findAll(
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
  ) {
    const limit = limitRaw !== undefined ? Number(limitRaw) : undefined;
    const offset = offsetRaw !== undefined ? Number(offsetRaw) : undefined;
    return this.targetsService.findAll(limit, offset);
  }

  @Post()
  create(@Body() body: Partial<BonusTargetEntity>) {
    return this.targetsService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<BonusTargetEntity>) {
    return this.targetsService.update(id, body);
  }

  @Post(':id/issue-reward')
  issueReward(
    @Param('id') id: string,
    @Body() body?: { approvedBy?: string },
  ) {
    return this.targetsService.issueReward(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.targetsService.remove(id);
  }
}
