import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingBuyout1730000000015 implements MigrationInterface {
  name = 'AddBookingBuyout1730000000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "bookingBuyout" double precision',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "sales" DROP COLUMN IF EXISTS "bookingBuyout"',
    );
  }
}

