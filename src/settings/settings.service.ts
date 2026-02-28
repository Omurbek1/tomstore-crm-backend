import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSettingEntity } from '../database/entities/app-setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(AppSettingEntity)
    private readonly settingsRepo: Repository<AppSettingEntity>,
  ) {}

  private async ensureSettings() {
    const [first] = await this.settingsRepo.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });
    if (first) return first;
    const created = this.settingsRepo.create({ companyName: 'TOMSTORE' });
    return this.settingsRepo.save(created);
  }

  getSettings() {
    return this.ensureSettings();
  }

  async updateSettings(payload: Partial<AppSettingEntity>) {
    const current = await this.ensureSettings();
    const next = {
      companyName:
        payload.companyName !== undefined
          ? String(payload.companyName || '').trim() || current.companyName
          : current.companyName,
      companyLogoUrl: payload.companyLogoUrl,
    } as Partial<AppSettingEntity>;
    await this.settingsRepo.update(current.id, next);
    return this.settingsRepo.findOneByOrFail({ id: current.id });
  }
}
