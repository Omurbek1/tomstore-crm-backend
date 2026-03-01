import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ClientEntity } from '../database/entities/client.entity';
import { ClientPromotionEntity } from '../database/entities/client-promotion.entity';
import { ClientsService } from './clients.service';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  findAll(
    @Query('q') q?: string,
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
    @Query('activeOnly') activeOnlyRaw?: string,
  ) {
    const limit = limitRaw !== undefined ? Number(limitRaw) : undefined;
    const offset = offsetRaw !== undefined ? Number(offsetRaw) : undefined;
    const activeOnly = activeOnlyRaw === '1' || activeOnlyRaw === 'true';
    return this.clientsService.findAll({ q, limit, offset, activeOnly });
  }

  @Post()
  create(@Body() body: Partial<ClientEntity> & { referredByCode?: string }) {
    return this.clientsService.create(body);
  }

  @Get('referral/:code')
  findByReferralCode(@Param('code') code: string) {
    return this.clientsService.findByReferralCode(code);
  }

  @Get(':id/history')
  history(@Param('id') id: string) {
    return this.clientsService.history(id);
  }

  @Get('promotions/list')
  listPromotions(@Query('clientId') clientId?: string) {
    return this.clientsService.listPromotions(clientId);
  }

  @Post('promotions')
  createPromotion(@Body() body: Partial<ClientPromotionEntity>) {
    return this.clientsService.createPromotion(body);
  }

  @Patch('promotions/:id')
  updatePromotion(
    @Param('id') id: string,
    @Body() body: Partial<ClientPromotionEntity>,
  ) {
    return this.clientsService.updatePromotion(id, body);
  }

  @Delete('promotions/:id')
  removePromotion(@Param('id') id: string) {
    return this.clientsService.removePromotion(id);
  }

  @Post(':id/sms')
  sendSms(@Param('id') id: string, @Body('message') message?: string) {
    return this.clientsService.sendSms(id, message || '');
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<ClientEntity> & { referredByCode?: string },
  ) {
    return this.clientsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }
}
