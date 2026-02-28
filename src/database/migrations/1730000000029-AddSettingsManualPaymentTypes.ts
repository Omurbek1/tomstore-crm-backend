import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSettingsManualPaymentTypes1730000000029
  implements MigrationInterface
{
  name = 'AddSettingsManualPaymentTypes1730000000029';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "manualPaymentTypes" text[] NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_settings" DROP COLUMN IF EXISTS "manualPaymentTypes"`,
    );
  }
}
