import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductBarcode1730000000025 implements MigrationInterface {
  name = 'AddProductBarcode1730000000025';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "barcode" character varying
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_products_barcode"
      ON "products" ("barcode")
      WHERE "barcode" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_products_barcode"`);
    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN IF EXISTS "barcode"
    `);
  }
}
