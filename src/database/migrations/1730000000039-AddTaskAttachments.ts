import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskAttachments1730000000039 implements MigrationInterface {
  name = 'AddTaskAttachments1730000000039';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "attachmentUrls" text[] NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP COLUMN IF EXISTS "attachmentUrls"`,
    );
  }
}

