import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsersDeletedFlag1730000000004 implements MigrationInterface {
  name = 'AddUsersDeletedFlag1730000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deleted" boolean NOT NULL DEFAULT false',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" DROP COLUMN IF EXISTS "deleted"',
    );
  }
}
