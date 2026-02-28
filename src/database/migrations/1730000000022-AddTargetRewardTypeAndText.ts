import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTargetRewardTypeAndText1730000000022
  implements MigrationInterface
{
  name = 'AddTargetRewardTypeAndText1730000000022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "targets"
      ADD COLUMN IF NOT EXISTS "rewardType" character varying NOT NULL DEFAULT 'money'
    `);
    await queryRunner.query(`
      ALTER TABLE "targets"
      ADD COLUMN IF NOT EXISTS "rewardText" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "targets"
      DROP COLUMN IF EXISTS "rewardText"
    `);
    await queryRunner.query(`
      ALTER TABLE "targets"
      DROP COLUMN IF EXISTS "rewardType"
    `);
  }
}

