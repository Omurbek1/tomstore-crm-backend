import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSettingsAndMaterials1730000000018
  implements MigrationInterface
{
  name = 'AddSettingsAndMaterials1730000000018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "app_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "companyName" character varying NOT NULL DEFAULT 'TOMSTORE',
        "companyLogoUrl" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_app_settings_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "app_settings" ("companyName")
      SELECT 'TOMSTORE'
      WHERE NOT EXISTS (SELECT 1 FROM "app_settings")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "training_materials" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text,
        "type" character varying NOT NULL DEFAULT 'other',
        "url" text NOT NULL,
        "thumbnailUrl" text,
        "createdById" character varying,
        "createdByName" character varying,
        "isPublished" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_training_materials_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "training_materials"');
    await queryRunner.query('DROP TABLE IF EXISTS "app_settings"');
  }
}
