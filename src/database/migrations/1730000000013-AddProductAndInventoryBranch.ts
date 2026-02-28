import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductAndInventoryBranch1730000000013
  implements MigrationInterface
{
  name = 'AddProductAndInventoryBranch1730000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "branchName" character varying',
    );
    await queryRunner.query(`
      UPDATE "products"
      SET "branchName" = 'Центральный'
      WHERE "branchName" IS NULL
    `);

    await queryRunner.query(
      'ALTER TABLE "inventory_movements" ADD COLUMN IF NOT EXISTS "branchName" character varying',
    );
    await queryRunner.query(`
      UPDATE "inventory_movements"
      SET "branchName" = 'Центральный'
      WHERE "branchName" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "inventory_movements" DROP COLUMN IF EXISTS "branchName"',
    );
    await queryRunner.query(
      'ALTER TABLE "products" DROP COLUMN IF EXISTS "branchName"',
    );
  }
}
