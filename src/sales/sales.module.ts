import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryMovementEntity } from '../database/entities/inventory-movement.entity';
import { AppSettingEntity } from '../database/entities/app-setting.entity';
import { CashShiftEntity } from '../database/entities/cash-shift.entity';
import { ProductEntity } from '../database/entities/product.entity';
import { SaleEntity } from '../database/entities/sale.entity';
import { UserEntity } from '../database/entities/user.entity';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SaleEntity,
      ProductEntity,
      UserEntity,
      InventoryMovementEntity,
      CashShiftEntity,
      AppSettingEntity,
    ]),
  ],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
