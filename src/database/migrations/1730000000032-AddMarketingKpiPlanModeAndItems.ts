import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMarketingKpiPlanModeAndItems1730000000032
  implements MigrationInterface
{
  name = 'AddMarketingKpiPlanModeAndItems1730000000032';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "marketing_kpis" ADD COLUMN IF NOT EXISTS "planMode" character varying NOT NULL DEFAULT 'month'`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_kpis" ADD COLUMN IF NOT EXISTS "periodStart" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_kpis" ADD COLUMN IF NOT EXISTS "periodEnd" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_kpis" ADD COLUMN IF NOT EXISTS "planItems" jsonb NOT NULL DEFAULT '[]'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "marketing_kpis" DROP COLUMN IF EXISTS "planItems"`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_kpis" DROP COLUMN IF EXISTS "periodEnd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_kpis" DROP COLUMN IF EXISTS "periodStart"`,
    );
    await queryRunner.query(
      `ALTER TABLE "marketing_kpis" DROP COLUMN IF EXISTS "planMode"`,
    );
  }
}
