import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSupplierMediaLinks1730000000040 implements MigrationInterface {
  name = 'AddSupplierMediaLinks1730000000040';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "imageUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "videoUrl" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "suppliers" DROP COLUMN IF EXISTS "videoUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" DROP COLUMN IF EXISTS "imageUrl"`,
    );
  }
}

