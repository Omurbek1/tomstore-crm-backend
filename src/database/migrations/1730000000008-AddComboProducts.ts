import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddComboProducts1730000000008 implements MigrationInterface {
  name = 'AddComboProducts1730000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "isCombo" boolean NOT NULL DEFAULT false',
    );
    await queryRunner.query(
      'ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "comboItems" jsonb',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "products" DROP COLUMN IF EXISTS "comboItems"',
    );
    await queryRunner.query(
      'ALTER TABLE "products" DROP COLUMN IF EXISTS "isCombo"',
    );
  }
}
