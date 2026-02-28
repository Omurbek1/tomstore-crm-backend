import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAiMemory1730000000034 implements MigrationInterface {
  name = 'AddAiMemory1730000000034';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ai_memories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "domain" character varying NOT NULL,
        "audience" character varying,
        "question" text NOT NULL,
        "answer" text NOT NULL,
        "embedding" jsonb NOT NULL,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_memories_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ai_memories_domain_createdAt" ON "ai_memories" ("domain", "createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ai_memories_domain_createdAt"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_memories"`);
  }
}

