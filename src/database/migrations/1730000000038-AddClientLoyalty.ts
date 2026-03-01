import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClientLoyalty1730000000038 implements MigrationInterface {
  name = 'AddClientLoyalty1730000000038';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "level" character varying NOT NULL DEFAULT 'silver'`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "totalSpent" double precision NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "cashbackRatePercent" double precision NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "cashbackBalance" double precision NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "cashbackExpiryDays" integer NOT NULL DEFAULT 180`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "cashbackExpiresAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "bonusesBlocked" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "referralCode" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "referredByClientId" character varying`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_clients_referralCode" ON "clients" ("referralCode")`,
    );

    await queryRunner.query(
      `ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "cashbackUsed" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "cashbackAccrued" double precision`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "client_loyalty_transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "clientId" character varying NOT NULL,
        "type" character varying NOT NULL,
        "amount" double precision NOT NULL,
        "expiresAt" TIMESTAMP,
        "saleId" character varying,
        "note" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_client_loyalty_transactions_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_client_loyalty_transactions_clientId" ON "client_loyalty_transactions" ("clientId")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "client_promotions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "clientId" character varying,
        "title" character varying NOT NULL,
        "description" text,
        "discountPercent" double precision NOT NULL DEFAULT 0,
        "startsAt" TIMESTAMP,
        "endsAt" TIMESTAMP,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_client_promotions_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_client_promotions_clientId" ON "client_promotions" ("clientId")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "client_sms_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "clientId" character varying NOT NULL,
        "phone" character varying NOT NULL,
        "message" text NOT NULL,
        "status" character varying NOT NULL DEFAULT 'queued',
        "error" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_client_sms_logs_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_client_sms_logs_clientId" ON "client_sms_logs" ("clientId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_client_sms_logs_clientId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "client_sms_logs"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_client_promotions_clientId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "client_promotions"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_client_loyalty_transactions_clientId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "client_loyalty_transactions"`);
    await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN IF EXISTS "cashbackAccrued"`);
    await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN IF EXISTS "cashbackUsed"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clients_referralCode"`);
    await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN IF EXISTS "referredByClientId"`);
    await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN IF EXISTS "referralCode"`);
    await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN IF EXISTS "bonusesBlocked"`);
    await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN IF EXISTS "cashbackExpiresAt"`);
    await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN IF EXISTS "cashbackExpiryDays"`);
    await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN IF EXISTS "cashbackBalance"`);
    await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN IF EXISTS "cashbackRatePercent"`);
    await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN IF EXISTS "totalSpent"`);
    await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN IF EXISTS "level"`);
  }
}

