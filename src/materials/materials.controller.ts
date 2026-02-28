import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TrainingMaterialFolderEntity } from '../database/entities/training-material-folder.entity';
import { TrainingMaterialEntity } from '../database/entities/training-material.entity';
import { MaterialsService } from './materials.service';

@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get('folders')
  findFolders() {
    return this.materialsService.findFolders();
  }

  @Post('folders')
  createFolder(@Body() body: Partial<TrainingMaterialFolderEntity>) {
    return this.materialsService.createFolder(body);
  }

  @Patch('folders/:id')
  updateFolder(
    @Param('id') id: string,
    @Body() body: Partial<TrainingMaterialFolderEntity>,
  ) {
    return this.materialsService.updateFolder(id, body);
  }

  @Delete('folders/:id')
  removeFolder(@Param('id') id: string) {
    return this.materialsService.removeFolder(id);
  }

  @Get()
  findAll(
    @Query('folderId') folderId?: string,
    @Query('q') q?: string,
    @Query('includeDrafts') includeDraftsRaw?: string,
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
  ) {
    const includeDrafts = includeDraftsRaw === '1' || includeDraftsRaw === 'true';
    const limit = limitRaw !== undefined ? Number(limitRaw) : undefined;
    const offset = offsetRaw !== undefined ? Number(offsetRaw) : undefined;
    return this.materialsService.findAll({
      folderId,
      q,
      includeDrafts,
      limit,
      offset,
    });
  }

  @Post()
  create(@Body() body: Partial<TrainingMaterialEntity>) {
    return this.materialsService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<TrainingMaterialEntity>) {
    return this.materialsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.materialsService.remove(id);
  }
}
