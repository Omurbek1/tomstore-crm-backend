import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryMovementEntity } from '../database/entities/inventory-movement.entity';
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
    ]),
  ],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
