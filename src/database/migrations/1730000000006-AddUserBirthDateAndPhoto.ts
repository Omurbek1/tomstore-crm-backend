import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserBirthDateAndPhoto1730000000006
  implements MigrationInterface
{
  name = 'AddUserBirthDateAndPhoto1730000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP',
    );
    await queryRunner.query(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "photoUrl" character varying',
    );
    await queryRunner.query(
      `UPDATE "users" SET "birthDate" = make_timestamp("birthYear", 1, 1, 0, 0, 0)
       WHERE "birthDate" IS NULL AND "birthYear" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" DROP COLUMN IF EXISTS "photoUrl"',
    );
    await queryRunner.query(
      'ALTER TABLE "users" DROP COLUMN IF EXISTS "birthDate"',
    );
  }
}
