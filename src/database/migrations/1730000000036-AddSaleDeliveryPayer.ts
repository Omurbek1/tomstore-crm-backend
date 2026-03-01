import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSaleDeliveryPayer1730000000036 implements MigrationInterface {
  name = 'AddSaleDeliveryPayer1730000000036';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "deliveryPaidByCompany" boolean`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sales" DROP COLUMN IF EXISTS "deliveryPaidByCompany"`,
    );
  }
}

