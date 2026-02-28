import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMarketingKpi1730000000031 implements MigrationInterface {
  name = 'AddMarketingKpi1730000000031';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "marketing_kpis" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "managerId" character varying NOT NULL,
        "managerName" character varying NOT NULL,
        "managerRole" character varying,
        "branchName" character varying,
        "month" character varying NOT NULL,
        "plannedPosts" integer NOT NULL DEFAULT 0,
        "plannedReels" integer NOT NULL DEFAULT 0,
        "publishedPosts" integer NOT NULL DEFAULT 0,
        "publishedReels" integer NOT NULL DEFAULT 0,
        "reach" double precision NOT NULL DEFAULT 0,
        "engagements" double precision NOT NULL DEFAULT 0,
        "followersGrowth" double precision NOT NULL DEFAULT 0,
        "erPercent" double precision NOT NULL DEFAULT 0,
        "kpiScore" double precision NOT NULL DEFAULT 0,
        "salaryBase" double precision NOT NULL DEFAULT 0,
        "salaryBonus" double precision NOT NULL DEFAULT 0,
        "salaryTotal" double precision NOT NULL DEFAULT 0,
        "note" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_marketing_kpis_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_marketing_kpis_month" ON "marketing_kpis" ("month")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_marketing_kpis_manager" ON "marketing_kpis" ("managerId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_marketing_kpis_manager"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_marketing_kpis_month"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "marketing_kpis"`);
  }
}
