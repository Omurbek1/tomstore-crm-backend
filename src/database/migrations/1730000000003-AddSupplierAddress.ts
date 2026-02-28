import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSupplierAddress1730000000003 implements MigrationInterface {
  name = 'AddSupplierAddress1730000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "address" character varying',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "suppliers" DROP COLUMN IF EXISTS "address"',
    );
  }
}
