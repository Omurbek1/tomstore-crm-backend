import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1730000000000 implements MigrationInterface {
  name = 'InitSchema1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "password" character varying NOT NULL,
        "role" character varying NOT NULL DEFAULT 'manager',
        "theme" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_name" UNIQUE ("name"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "category" character varying NOT NULL,
        "costPrice" double precision NOT NULL DEFAULT 0,
        "sellingPrice" double precision NOT NULL DEFAULT 0,
        "supplier" character varying,
        "managerEarnings" double precision,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_products_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "suppliers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "contacts" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_suppliers_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sales" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "clientName" character varying NOT NULL,
        "clientPhone" character varying,
        "clientAddress" character varying,
        "productId" character varying NOT NULL,
        "productName" character varying NOT NULL,
        "supplierSnapshot" character varying,
        "costPriceSnapshot" double precision NOT NULL DEFAULT 0,
        "price" double precision NOT NULL DEFAULT 0,
        "quantity" integer NOT NULL DEFAULT 1,
        "total" double precision NOT NULL DEFAULT 0,
        "branch" character varying NOT NULL DEFAULT 'Центральный',
        "paymentType" character varying NOT NULL DEFAULT 'cash',
        "installmentMonths" integer,
        "managerEarnings" double precision NOT NULL DEFAULT 0,
        "potentialEarnings" double precision,
        "baseManagerEarnings" double precision,
        "deliveryStatus" character varying NOT NULL DEFAULT 'reserved',
        "saleType" character varying NOT NULL DEFAULT 'office',
        "managerId" character varying,
        "managerName" character varying NOT NULL DEFAULT 'Unknown',
        "bookingDeadline" TIMESTAMP WITH TIME ZONE,
        "bookingDeposit" double precision,
        "manualDate" TIMESTAMP WITH TIME ZONE,
        "updatedBy" character varying,
        "deliveryCost" double precision,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sales_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bonuses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "managerId" character varying,
        "managerName" character varying NOT NULL DEFAULT 'Unknown',
        "amount" double precision NOT NULL DEFAULT 0,
        "reason" character varying NOT NULL DEFAULT 'Без комментария',
        "addedBy" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bonuses_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "expenses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "amount" double precision NOT NULL DEFAULT 0,
        "category" character varying NOT NULL DEFAULT 'Прочее',
        "comment" character varying,
        "managerId" character varying,
        "managerName" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_expenses_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "targets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" character varying NOT NULL DEFAULT 'global',
        "managerId" character varying,
        "amount" double precision NOT NULL DEFAULT 0,
        "reward" double precision NOT NULL DEFAULT 0,
        "deadline" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_targets_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "targets"');
    await queryRunner.query('DROP TABLE IF EXISTS "expenses"');
    await queryRunner.query('DROP TABLE IF EXISTS "bonuses"');
    await queryRunner.query('DROP TABLE IF EXISTS "sales"');
    await queryRunner.query('DROP TABLE IF EXISTS "suppliers"');
    await queryRunner.query('DROP TABLE IF EXISTS "products"');
    await queryRunner.query('DROP TABLE IF EXISTS "users"');
  }
}
