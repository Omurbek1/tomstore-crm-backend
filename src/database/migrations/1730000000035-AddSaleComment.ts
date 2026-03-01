import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSaleComment1730000000035 implements MigrationInterface {
  name = 'AddSaleComment1730000000035';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "comment" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sales" DROP COLUMN IF EXISTS "comment"`,
    );
  }
}

