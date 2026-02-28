import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserCanManageProducts1730000000023
  implements MigrationInterface
{
  name = 'AddUserCanManageProducts1730000000023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "canManageProducts" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "canManageProducts" = true
      WHERE "role" IN ('admin', 'superadmin')
         OR "roles" LIKE '%admin%'
         OR "roles" LIKE '%superadmin%'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "canManageProducts"
    `);
  }
}

