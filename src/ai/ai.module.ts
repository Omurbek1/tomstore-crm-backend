import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiMemoryEntity } from '../database/entities/ai-memory.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AiMemoryEntity])],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
