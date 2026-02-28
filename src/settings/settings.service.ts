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

  private async ensureManualPaymentTypesColumn() {
    await this.settingsRepo.query(
      `ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "manualPaymentTypes" text[] NOT NULL DEFAULT '{}'`,
    );
  }

  private async ensureSettings() {
    await this.ensureManualPaymentTypesColumn();
    const [first] = await this.settingsRepo.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });
    if (first) return first;
    const created = this.settingsRepo.create({
      companyName: 'TOMSTORE',
      manualPaymentTypes: [],
    });
    return this.settingsRepo.save(created);
  }

  private normalizeManualPaymentTypes(value: unknown): string[] {
    const blocked = new Set(['hybrid', 'гибрид']);
    const input = Array.isArray(value) ? value : [];
    const normalized = input
      .map((item) => String(item ?? '').trim())
      .filter(Boolean)
      .filter((item) => !blocked.has(item.toLowerCase()));
    return Array.from(new Set(normalized));
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
      manualPaymentTypes:
        payload.manualPaymentTypes !== undefined
          ? this.normalizeManualPaymentTypes(payload.manualPaymentTypes)
          : current.manualPaymentTypes || [],
    } as Partial<AppSettingEntity>;
    await this.settingsRepo.update(current.id, next);
    return this.settingsRepo.findOneByOrFail({ id: current.id });
  }
}
