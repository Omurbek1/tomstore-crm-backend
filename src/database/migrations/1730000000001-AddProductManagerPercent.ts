import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductManagerPercent1730000000001
  implements MigrationInterface
{
  name = 'AddProductManagerPercent1730000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "managerPercent" double precision',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "products" DROP COLUMN IF EXISTS "managerPercent"',
    );
  }
}
