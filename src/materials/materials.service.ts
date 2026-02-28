import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingMaterialFolderEntity } from '../database/entities/training-material-folder.entity';
import { TrainingMaterialEntity } from '../database/entities/training-material.entity';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(TrainingMaterialEntity)
    private readonly materialsRepo: Repository<TrainingMaterialEntity>,
    @InjectRepository(TrainingMaterialFolderEntity)
    private readonly foldersRepo: Repository<TrainingMaterialFolderEntity>,
  ) {}

  async findFolders() {
    const [items, total] = await this.foldersRepo.findAndCount({
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    return { items, total };
  }

  createFolder(payload: Partial<TrainingMaterialFolderEntity>) {
    const name = String(payload.name || '').trim();
    if (!name) {
      throw new BadRequestException('Название папки обязательно');
    }
    const folder = this.foldersRepo.create({
      name,
      description: payload.description,
      sortOrder: Number(payload.sortOrder ?? 0),
    });
    return this.foldersRepo.save(folder);
  }

  async updateFolder(id: string, payload: Partial<TrainingMaterialFolderEntity>) {
    const found = await this.foldersRepo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Папка не найдена');

    await this.foldersRepo.update(id, {
      name:
        payload.name !== undefined
          ? String(payload.name || '').trim()
          : undefined,
      description: payload.description,
      sortOrder:
        payload.sortOrder === undefined
          ? undefined
          : Number(payload.sortOrder ?? 0),
    });
    return this.foldersRepo.findOneByOrFail({ id });
  }

  async removeFolder(id: string): Promise<{ success: true }> {
    await this.materialsRepo
      .createQueryBuilder()
      .update(TrainingMaterialEntity)
      .set({ folderId: null })
      .where('"folderId" = :id', { id })
      .execute();

    await this.foldersRepo.delete(id);
    return { success: true };
  }

  async findAll(query?: {
    folderId?: string;
    q?: string;
    includeDrafts?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const limit = Math.max(1, Math.min(100, Number(query?.limit ?? 20)));
    const offset = Math.max(0, Number(query?.offset ?? 0));

    const qb = this.materialsRepo
      .createQueryBuilder('m')
      .orderBy('m.lessonOrder', 'ASC')
      .addOrderBy('m.createdAt', 'DESC');

    if (query?.folderId?.trim()) {
      if (query.folderId === 'ungrouped') {
        qb.andWhere('m.folderId IS NULL');
      } else {
        qb.andWhere('m.folderId = :folderId', { folderId: query.folderId.trim() });
      }
    }

    if (!query?.includeDrafts) {
      qb.andWhere('m.isPublished = true');
    }

    if (query?.q?.trim()) {
      const q = `%${query.q.trim().toLowerCase()}%`;
      qb.andWhere(
        "(LOWER(m.title) LIKE :q OR LOWER(COALESCE(m.description, '')) LIKE :q)",
        { q },
      );
    }

    qb.skip(offset).take(limit);
    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  async create(payload: Partial<TrainingMaterialEntity>) {
    if (payload.folderId) {
      const folder = await this.foldersRepo.findOne({ where: { id: payload.folderId } });
      if (!folder) throw new BadRequestException('Папка не найдена');
    }

    const material = this.materialsRepo.create({
      title: String(payload.title || '').trim(),
      description: payload.description,
      type: (payload.type as TrainingMaterialEntity['type']) || 'other',
      url: String(payload.url || '').trim(),
      folderId: payload.folderId || null,
      lessonOrder: Number(payload.lessonOrder ?? 0),
      thumbnailUrl: payload.thumbnailUrl,
      createdById: payload.createdById,
      createdByName: payload.createdByName,
      isPublished: payload.isPublished ?? true,
    });
    return this.materialsRepo.save(material);
  }

  async update(id: string, payload: Partial<TrainingMaterialEntity>) {
    const found = await this.materialsRepo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Материал не найден');

    if (payload.folderId) {
      const folder = await this.foldersRepo.findOne({ where: { id: payload.folderId } });
      if (!folder) throw new BadRequestException('Папка не найдена');
    }

    await this.materialsRepo.update(id, {
      ...payload,
      title:
        payload.title !== undefined
          ? String(payload.title || '').trim()
          : undefined,
      url:
        payload.url !== undefined
          ? String(payload.url || '').trim()
          : undefined,
      folderId: payload.folderId === undefined ? undefined : payload.folderId || null,
      lessonOrder:
        payload.lessonOrder === undefined
          ? undefined
          : Number(payload.lessonOrder ?? 0),
    });

    return this.materialsRepo.findOneByOrFail({ id });
  }

  async remove(id: string): Promise<{ success: true }> {
    await this.materialsRepo.delete(id);
    return { success: true };
  }
}
