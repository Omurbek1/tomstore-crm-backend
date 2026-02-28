import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCashShiftDebtFields1730000000028 implements MigrationInterface {
  name = 'AddCashShiftDebtFields1730000000028';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cash_shifts" ADD COLUMN IF NOT EXISTS "debtBefore" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_shifts" ADD COLUMN IF NOT EXISTS "shortageAmount" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_shifts" ADD COLUMN IF NOT EXISTS "overageAmount" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_shifts" ADD COLUMN IF NOT EXISTS "debtAfter" double precision`,
    );

    await queryRunner.query(`
      UPDATE "cash_shifts"
      SET
        "shortageAmount" = CASE
          WHEN COALESCE("difference", 0) < 0 THEN ABS(COALESCE("difference", 0))
          ELSE 0
        END,
        "overageAmount" = CASE
          WHEN COALESCE("difference", 0) > 0 THEN COALESCE("difference", 0)
          ELSE 0
        END
      WHERE "status" = 'closed'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cash_shifts" DROP COLUMN IF EXISTS "debtAfter"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_shifts" DROP COLUMN IF EXISTS "overageAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_shifts" DROP COLUMN IF EXISTS "shortageAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_shifts" DROP COLUMN IF EXISTS "debtBefore"`,
    );
  }
}
