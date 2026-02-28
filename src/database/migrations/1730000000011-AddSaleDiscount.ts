import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSaleDiscount1730000000011 implements MigrationInterface {
  name = 'AddSaleDiscount1730000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "discount" double precision',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "sales" DROP COLUMN IF EXISTS "discount"',
    );
  }
}
