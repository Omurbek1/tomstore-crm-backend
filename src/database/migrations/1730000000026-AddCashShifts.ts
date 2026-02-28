import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCashShifts1730000000026 implements MigrationInterface {
  name = 'AddCashShifts1730000000026';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cash_shifts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "cashierId" character varying NOT NULL,
        "cashierName" character varying NOT NULL,
        "branchName" character varying,
        "status" character varying NOT NULL DEFAULT 'open',
        "openedAt" TIMESTAMPTZ NOT NULL,
        "closedAt" TIMESTAMPTZ,
        "openingCash" double precision NOT NULL DEFAULT 0,
        "closingCash" double precision,
        "expectedCash" double precision,
        "difference" double precision,
        "noteOpen" text,
        "noteClose" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cash_shifts_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cash_shifts_cashierId" ON "cash_shifts" ("cashierId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cash_shifts_status" ON "cash_shifts" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cash_shifts_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cash_shifts_cashierId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cash_shifts"`);
  }
}
