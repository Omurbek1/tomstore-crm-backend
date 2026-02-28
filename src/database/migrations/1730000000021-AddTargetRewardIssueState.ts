import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTargetRewardIssueState1730000000021
  implements MigrationInterface
{
  name = 'AddTargetRewardIssueState1730000000021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "targets"
      ADD COLUMN IF NOT EXISTS "rewardIssued" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "targets"
      ADD COLUMN IF NOT EXISTS "rewardIssuedAt" timestamptz
    `);
    await queryRunner.query(`
      ALTER TABLE "targets"
      ADD COLUMN IF NOT EXISTS "rewardApprovedBy" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "targets"
      DROP COLUMN IF EXISTS "rewardApprovedBy"
    `);
    await queryRunner.query(`
      ALTER TABLE "targets"
      DROP COLUMN IF EXISTS "rewardIssuedAt"
    `);
    await queryRunner.query(`
      ALTER TABLE "targets"
      DROP COLUMN IF EXISTS "rewardIssued"
    `);
  }
}

