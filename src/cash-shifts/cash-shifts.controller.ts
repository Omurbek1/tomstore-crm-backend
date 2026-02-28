import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CashShiftsService } from './cash-shifts.service';

@Controller('cash-shifts')
export class CashShiftsController {
  constructor(private readonly cashShiftsService: CashShiftsService) {}

  @Get()
  findAll(
    @Query('cashierId') cashierId?: string,
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
  ) {
    const limit = limitRaw !== undefined ? Number(limitRaw) : undefined;
    const offset = offsetRaw !== undefined ? Number(offsetRaw) : undefined;
    return this.cashShiftsService.findAll({ cashierId, limit, offset });
  }

  @Get('current')
  current(@Query('cashierId') cashierId: string) {
    return this.cashShiftsService.getCurrent(cashierId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cashShiftsService.findOne(id);
  }

  @Get(':id/report')
  report(@Param('id') id: string) {
    return this.cashShiftsService.getReport(id);
  }

  @Post('open')
  open(
    @Body()
    body: {
      cashierId?: string;
      cashierName?: string;
      branchName?: string;
      openingCash?: number;
      noteOpen?: string;
    },
  ) {
    return this.cashShiftsService.openShift(body);
  }

  @Post(':id/close')
  close(
    @Param('id') id: string,
    @Body()
    body: {
      closingCash?: number;
      noteClose?: string;
    },
  ) {
    return this.cashShiftsService.closeShift(id, body);
  }
}
