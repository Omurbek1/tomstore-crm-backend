import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTasks1730000000030 implements MigrationInterface {
  name = 'AddTasks1730000000030';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text,
        "assigneeId" character varying,
        "assigneeName" character varying,
        "assigneeRole" character varying,
        "createdById" character varying,
        "createdByName" character varying,
        "status" character varying NOT NULL DEFAULT 'todo',
        "priority" character varying NOT NULL DEFAULT 'medium',
        "deadline" TIMESTAMP,
        "completedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tasks_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "tasks"`);
  }
}
