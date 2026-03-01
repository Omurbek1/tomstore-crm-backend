import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientEntity } from '../database/entities/client.entity';
import { ClientLoyaltyTransactionEntity } from '../database/entities/client-loyalty-transaction.entity';
import { ClientPromotionEntity } from '../database/entities/client-promotion.entity';
import { ClientSmsLogEntity } from '../database/entities/client-sms-log.entity';
import { SaleEntity } from '../database/entities/sale.entity';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClientEntity,
      ClientLoyaltyTransactionEntity,
      ClientPromotionEntity,
      ClientSmsLogEntity,
      SaleEntity,
    ]),
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}
