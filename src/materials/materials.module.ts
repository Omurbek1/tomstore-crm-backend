import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingMaterialFolderEntity } from '../database/entities/training-material-folder.entity';
import { TrainingMaterialEntity } from '../database/entities/training-material.entity';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';

@Module({
  imports: [TypeOrmModule.forFeature([TrainingMaterialEntity, TrainingMaterialFolderEntity])],
  controllers: [MaterialsController],
  providers: [MaterialsService],
})
export class MaterialsModule {}
