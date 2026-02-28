import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBranchesAndUserBranch1730000000012
  implements MigrationInterface
{
  name = 'AddBranchesAndUserBranch1730000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "branches" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_branches_name" UNIQUE ("name"),
        CONSTRAINT "PK_branches_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "branches" ("name")
      VALUES ('Центральный')
      ON CONFLICT ("name") DO NOTHING
    `);

    await queryRunner.query(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "branchId" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "branchName" character varying',
    );
    await queryRunner.query(`
      UPDATE "users"
      SET "branchName" = 'Центральный'
      WHERE "branchName" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" DROP COLUMN IF EXISTS "branchName"',
    );
    await queryRunner.query(
      'ALTER TABLE "users" DROP COLUMN IF EXISTS "branchId"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "branches"');
  }
}
