import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRepairs1730000000024 implements MigrationInterface {
  name = 'AddRepairs1730000000024';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "repair_tickets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "clientName" character varying NOT NULL,
        "clientPhone" character varying,
        "itemName" character varying NOT NULL,
        "serialNumber" character varying,
        "issue" text NOT NULL,
        "branchName" character varying,
        "status" character varying NOT NULL DEFAULT 'received',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_repair_tickets_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "repair_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ticketId" uuid NOT NULL,
        "text" text NOT NULL,
        "author" character varying NOT NULL,
        "status" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_repair_events_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_repair_events_ticket" FOREIGN KEY ("ticketId")
          REFERENCES "repair_tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_repair_events_ticketId" ON "repair_events" ("ticketId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_repair_tickets_updatedAt" ON "repair_tickets" ("updatedAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_repair_tickets_updatedAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_repair_events_ticketId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "repair_events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "repair_tickets"`);
  }
}
