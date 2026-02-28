import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSaleShiftId1730000000027 implements MigrationInterface {
  name = 'AddSaleShiftId1730000000027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sales"
      ADD COLUMN IF NOT EXISTS "shiftId" uuid
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_sales_shiftId" ON "sales" ("shiftId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sales_shiftId"`);
    await queryRunner.query(`
      ALTER TABLE "sales"
      DROP COLUMN IF EXISTS "shiftId"
    `);
  }
}
