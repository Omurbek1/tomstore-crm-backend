import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMaterialFoldersAndLessonOrder1730000000019
  implements MigrationInterface
{
  name = 'AddMaterialFoldersAndLessonOrder1730000000019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "training_material_folders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_training_material_folders_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "training_materials"
      ADD COLUMN IF NOT EXISTS "folderId" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "training_materials"
      ADD COLUMN IF NOT EXISTS "lessonOrder" integer NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_training_materials_folderId"
      ON "training_materials" ("folderId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_training_materials_folderId"',
    );
    await queryRunner.query(`
      ALTER TABLE "training_materials"
      DROP COLUMN IF EXISTS "lessonOrder"
    `);
    await queryRunner.query(`
      ALTER TABLE "training_materials"
      DROP COLUMN IF EXISTS "folderId"
    `);
    await queryRunner.query('DROP TABLE IF EXISTS "training_material_folders"');
  }
}
