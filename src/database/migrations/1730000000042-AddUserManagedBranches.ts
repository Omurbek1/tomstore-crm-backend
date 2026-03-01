import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserManagedBranches1730000000042 implements MigrationInterface {
  name = 'AddUserManagedBranches1730000000042';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "managedBranchIds" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "managedBranchNames" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "managedBranchNames"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "managedBranchIds"`,
    );
  }
}
