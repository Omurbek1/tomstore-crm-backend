import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryMovementEntity } from '../database/entities/inventory-movement.entity';
import { AppSettingEntity } from '../database/entities/app-setting.entity';
import { CashShiftEntity } from '../database/entities/cash-shift.entity';
import { ClientEntity } from '../database/entities/client.entity';
import { ClientLoyaltyTransactionEntity } from '../database/entities/client-loyalty-transaction.entity';
import { ClientPromotionEntity } from '../database/entities/client-promotion.entity';
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
      ClientEntity,
      ClientLoyaltyTransactionEntity,
      ClientPromotionEntity,
      InventoryMovementEntity,
      CashShiftEntity,
      AppSettingEntity,
    ]),
  ],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
