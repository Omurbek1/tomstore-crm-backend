import { Body, Controller, Get, Patch } from '@nestjs/common';
import { AppSettingEntity } from '../database/entities/app-setting.entity';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  updateSettings(@Body() body: Partial<AppSettingEntity>) {
    return this.settingsService.updateSettings(body);
  }
}
