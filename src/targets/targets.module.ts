import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BonusEntity } from '../database/entities/bonus.entity';
import { BonusTargetEntity } from '../database/entities/bonus-target.entity';
import { SaleEntity } from '../database/entities/sale.entity';
import { UserEntity } from '../database/entities/user.entity';
import { TargetsController } from './targets.controller';
import { TargetsService } from './targets.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BonusTargetEntity,
      BonusEntity,
      SaleEntity,
      UserEntity,
    ]),
  ],
  controllers: [TargetsController],
  providers: [TargetsService],
})
export class TargetsModule {}
