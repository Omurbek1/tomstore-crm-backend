import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInventory1730000000007 implements MigrationInterface {
  name = 'AddInventory1730000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "stockQty" integer NOT NULL DEFAULT 0',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "inventory_movements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "productId" character varying NOT NULL,
        "productName" character varying NOT NULL,
        "type" character varying NOT NULL,
        "quantity" integer NOT NULL,
        "stockAfter" integer NOT NULL,
        "reason" character varying,
        "actorId" character varying,
        "actorName" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_inventory_movements_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "inventory_movements"');
    await queryRunner.query(
      'ALTER TABLE "products" DROP COLUMN IF EXISTS "stockQty"',
    );
  }
}
