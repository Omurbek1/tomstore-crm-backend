import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductPhotoUrls1730000000009 implements MigrationInterface {
  name = 'AddProductPhotoUrls1730000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "photoUrls" jsonb',
    );
    await queryRunner.query(`
      UPDATE "products"
      SET "photoUrls" = CASE
        WHEN "photoUrl" IS NOT NULL AND "photoUrl" <> '' THEN jsonb_build_array("photoUrl")
        ELSE NULL
      END
      WHERE "photoUrls" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "products" DROP COLUMN IF EXISTS "photoUrls"',
    );
  }
}
