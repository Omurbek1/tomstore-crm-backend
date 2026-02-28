import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepairTicketEntity } from '../database/entities/repair-ticket.entity';
import { RepairEventEntity } from '../database/entities/repair-event.entity';
import { RepairsController } from './repairs.controller';
import { RepairsService } from './repairs.service';

@Module({
  imports: [TypeOrmModule.forFeature([RepairTicketEntity, RepairEventEntity])],
  controllers: [RepairsController],
  providers: [RepairsService],
})
export class RepairsModule {}
