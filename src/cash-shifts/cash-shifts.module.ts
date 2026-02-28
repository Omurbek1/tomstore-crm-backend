import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashShiftEntity } from '../database/entities/cash-shift.entity';
import { SaleEntity } from '../database/entities/sale.entity';
import { CashShiftsController } from './cash-shifts.controller';
import { CashShiftsService } from './cash-shifts.service';

@Module({
  imports: [TypeOrmModule.forFeature([CashShiftEntity, SaleEntity])],
  controllers: [CashShiftsController],
  providers: [CashShiftsService],
  exports: [CashShiftsService],
})
export class CashShiftsModule {}
