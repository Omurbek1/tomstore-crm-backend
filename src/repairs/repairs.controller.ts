import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RepairsService } from './repairs.service';
import { RepairStatus } from '../database/entities/repair-ticket.entity';

@Controller('repairs')
export class RepairsController {
  constructor(private readonly repairsService: RepairsService) {}

  @Get()
  findAll(
    @Query('q') q?: string,
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
  ) {
    const limit = limitRaw !== undefined ? Number(limitRaw) : undefined;
    const offset = offsetRaw !== undefined ? Number(offsetRaw) : undefined;
    return this.repairsService.findAll({ q, limit, offset });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.repairsService.findOne(id);
  }

  @Post()
  create(
    @Body()
    body: {
      clientName?: string;
      clientPhone?: string;
      itemName?: string;
      serialNumber?: string;
      issue?: string;
      branchName?: string;
      author?: string;
      initialMessage?: string;
    },
  ) {
    return this.repairsService.create(body);
  }

  @Post(':id/events')
  addEvent(
    @Param('id') id: string,
    @Body()
    body: {
      text?: string;
      author?: string;
      status?: RepairStatus;
    },
  ) {
    return this.repairsService.addEvent(id, body);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body()
    body: {
      status?: RepairStatus;
      author?: string;
      text?: string;
    },
  ) {
    return this.repairsService.updateStatus(id, body);
  }
}
