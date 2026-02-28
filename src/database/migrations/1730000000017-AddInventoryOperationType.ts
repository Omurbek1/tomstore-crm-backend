import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInventoryOperationType1730000000017
  implements MigrationInterface
{
  name = 'AddInventoryOperationType1730000000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" ADD COLUMN IF NOT EXISTS "operationType" character varying NOT NULL DEFAULT 'other'`,
    );

    await queryRunner.query(`
      UPDATE "inventory_movements"
      SET "operationType" = CASE
        WHEN LOWER(COALESCE("reason", '')) LIKE 'продажа%' THEN 'sale'
        WHEN "type" = 'adjustment' THEN 'adjustment'
        WHEN "type" = 'in' THEN 'manual_in'
        WHEN "type" = 'out' THEN 'manual_out'
        ELSE 'other'
      END
      WHERE "operationType" IS NULL OR "operationType" = 'other'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "inventory_movements" DROP COLUMN IF EXISTS "operationType"',
    );
  }
}

