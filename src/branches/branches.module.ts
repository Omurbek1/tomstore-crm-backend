import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchEntity } from '../database/entities/branch.entity';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';

@Module({
  imports: [TypeOrmModule.forFeature([BranchEntity])],
  controllers: [BranchesController],
  providers: [BranchesService],
})
export class BranchesModule {}
