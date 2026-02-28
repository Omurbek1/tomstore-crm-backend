import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfileFields1730000000005 implements MigrationInterface {
  name = 'AddUserProfileFields1730000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "login" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "address" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "birthYear" integer',
    );

    await queryRunner.query('UPDATE "users" SET "login" = "name" WHERE "login" IS NULL');
    await queryRunner.query('ALTER TABLE "users" ALTER COLUMN "login" SET NOT NULL');
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_login_unique" ON "users" ("login")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_users_login_unique"');
    await queryRunner.query(
      'ALTER TABLE "users" DROP COLUMN IF EXISTS "birthYear"',
    );
    await queryRunner.query(
      'ALTER TABLE "users" DROP COLUMN IF EXISTS "address"',
    );
    await queryRunner.query(
      'ALTER TABLE "users" DROP COLUMN IF EXISTS "phone"',
    );
    await queryRunner.query(
      'ALTER TABLE "users" DROP COLUMN IF EXISTS "login"',
    );
  }
}
