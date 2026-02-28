import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentDetails1730000000014 implements MigrationInterface {
  name = 'AddPaymentDetails1730000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "paymentLabel" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "hybridCash" double precision',
    );
    await queryRunner.query(
      'ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "hybridCard" double precision',
    );
    await queryRunner.query(
      'ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "hybridTransfer" double precision',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "sales" DROP COLUMN IF EXISTS "hybridTransfer"',
    );
    await queryRunner.query(
      'ALTER TABLE "sales" DROP COLUMN IF EXISTS "hybridCard"',
    );
    await queryRunner.query(
      'ALTER TABLE "sales" DROP COLUMN IF EXISTS "hybridCash"',
    );
    await queryRunner.query(
      'ALTER TABLE "sales" DROP COLUMN IF EXISTS "paymentLabel"',
    );
  }
}
