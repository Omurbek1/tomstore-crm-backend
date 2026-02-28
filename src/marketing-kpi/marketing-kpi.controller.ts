import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { MarketingKpiService } from './marketing-kpi.service';
import { MarketingKpiEntity } from '../database/entities/marketing-kpi.entity';

@Controller('marketing-kpi')
export class MarketingKpiController {
  constructor(private readonly marketingKpiService: MarketingKpiService) {}

  @Get()
  findAll(
    @Query('month') month?: string,
    @Query('managerId') managerId?: string,
    @Query('q') q?: string,
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
  ) {
    const limit = limitRaw !== undefined ? Number(limitRaw) : undefined;
    const offset = offsetRaw !== undefined ? Number(offsetRaw) : undefined;
    return this.marketingKpiService.findAll({ month, managerId, q, limit, offset });
  }

  @Post()
  create(@Body() body: Partial<MarketingKpiEntity>) {
    return this.marketingKpiService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<MarketingKpiEntity>) {
    return this.marketingKpiService.update(id, body);
  }
}
