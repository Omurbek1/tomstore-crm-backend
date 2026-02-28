import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductCategories1730000000010 implements MigrationInterface {
  name = 'AddProductCategories1730000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "categories" jsonb',
    );
    await queryRunner.query(`
      UPDATE "products"
      SET "categories" = CASE
        WHEN "category" IS NOT NULL AND "category" <> '' THEN jsonb_build_array("category")
        ELSE jsonb_build_array('Прочее')
      END
      WHERE "categories" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "products" DROP COLUMN IF EXISTS "categories"',
    );
  }
}
