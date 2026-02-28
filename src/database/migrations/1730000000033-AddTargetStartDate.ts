import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTargetStartDate1730000000033 implements MigrationInterface {
  name = 'AddTargetStartDate1730000000033';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "targets" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "targets" DROP COLUMN IF EXISTS "startDate"`,
    );
  }
}

