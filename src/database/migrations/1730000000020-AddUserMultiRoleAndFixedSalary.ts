import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserMultiRoleAndFixedSalary1730000000020
  implements MigrationInterface
{
  name = 'AddUserMultiRoleAndFixedSalary1730000000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "roles" text
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "salaryType" character varying NOT NULL DEFAULT 'commission'
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "fixedMonthlySalary" double precision NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "roles" = CASE
        WHEN "role" IS NULL OR "role" = '' THEN 'manager'
        ELSE "role"
      END
      WHERE "roles" IS NULL OR "roles" = ''
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "salaryType" = 'fixed'
      WHERE "role" IN ('storekeeper', 'cashier')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "fixedMonthlySalary"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "salaryType"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "roles"
    `);
  }
}

