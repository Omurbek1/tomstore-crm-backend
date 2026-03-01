import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClients1730000000037 implements MigrationInterface {
  name = 'AddClients1730000000037';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clients" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fullName" character varying NOT NULL,
        "phone" character varying,
        "birthDate" date,
        "discountPercent" double precision NOT NULL DEFAULT 0,
        "birthdayDiscountPercent" double precision NOT NULL DEFAULT 0,
        "note" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clients_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_clients_phone" ON "clients" ("phone")`,
    );

    await queryRunner.query(
      `ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "clientId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "loyaltyDiscountPercent" double precision`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sales" DROP COLUMN IF EXISTS "loyaltyDiscountPercent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" DROP COLUMN IF EXISTS "clientId"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clients_phone"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clients"`);
  }
}

