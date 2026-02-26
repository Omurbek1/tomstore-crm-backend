import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BonusEntity } from '../database/entities/bonus.entity';
import { UserEntity } from '../database/entities/user.entity';
import { BonusesController } from './bonuses.controller';
import { BonusesService } from './bonuses.service';

@Module({
  imports: [TypeOrmModule.forFeature([BonusEntity, UserEntity])],
  controllers: [BonusesController],
  providers: [BonusesService],
})
export class BonusesModule {}
