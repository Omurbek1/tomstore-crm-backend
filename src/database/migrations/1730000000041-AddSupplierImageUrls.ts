import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSupplierImageUrls1730000000041 implements MigrationInterface {
  name = 'AddSupplierImageUrls1730000000041';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "imageUrls" jsonb NOT NULL DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(`
      UPDATE "suppliers"
      SET "imageUrls" = CASE
        WHEN "imageUrl" IS NULL OR btrim("imageUrl") = '' THEN '[]'::jsonb
        ELSE jsonb_build_array("imageUrl")
      END
      WHERE "imageUrls" IS NULL OR "imageUrls" = '[]'::jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "suppliers" DROP COLUMN IF EXISTS "imageUrls"`,
    );
  }
}
