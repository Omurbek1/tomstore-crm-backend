import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductMediaAndCharacteristics1730000000002
  implements MigrationInterface
{
  name = 'AddProductMediaAndCharacteristics1730000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "photoUrl" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "characteristics" text',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "products" DROP COLUMN IF EXISTS "characteristics"',
    );
    await queryRunner.query(
      'ALTER TABLE "products" DROP COLUMN IF EXISTS "photoUrl"',
    );
  }
}
