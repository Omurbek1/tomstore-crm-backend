import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BonusTargetEntity } from '../database/entities/bonus-target.entity';
import { TargetsController } from './targets.controller';
import { TargetsService } from './targets.service';

@Module({
  imports: [TypeOrmModule.forFeature([BonusTargetEntity])],
  controllers: [TargetsController],
  providers: [TargetsService],
})
export class TargetsModule {}
