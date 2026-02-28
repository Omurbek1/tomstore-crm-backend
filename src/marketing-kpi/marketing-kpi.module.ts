import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketingKpiEntity } from '../database/entities/marketing-kpi.entity';
import { UserEntity } from '../database/entities/user.entity';
import { MarketingKpiController } from './marketing-kpi.controller';
import { MarketingKpiService } from './marketing-kpi.service';

@Module({
  imports: [TypeOrmModule.forFeature([MarketingKpiEntity, UserEntity])],
  controllers: [MarketingKpiController],
  providers: [MarketingKpiService],
})
export class MarketingKpiModule {}
