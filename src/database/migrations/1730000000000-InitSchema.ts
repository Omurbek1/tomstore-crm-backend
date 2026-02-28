import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1730000000000 implements MigrationInterface {
  name = 'InitSchema1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "login" character varying NOT NULL,
        "name" character varying NOT NULL,
        "password" character varying NOT NULL,
        "role" character varying NOT NULL DEFAULT 'manager',
        "theme" character varying,
        "phone" character varying,
        "address" character varying,
        "birthYear" integer,
        "birthDate" TIMESTAMP,
        "photoUrl" character varying,
        "branchId" character varying,
        "branchName" character varying,
        "deleted" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_login" UNIQUE ("login"),
        CONSTRAINT "UQ_users_name" UNIQUE ("name"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "branches" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_branches_name" UNIQUE ("name"),
        CONSTRAINT "PK_branches_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "category" character varying NOT NULL,
        "categories" jsonb,
        "costPrice" double precision NOT NULL DEFAULT 0,
        "sellingPrice" double precision NOT NULL DEFAULT 0,
        "supplier" character varying,
        "branchName" character varying,
        "photoUrl" character varying,
        "photoUrls" jsonb,
        "characteristics" text,
        "managerEarnings" double precision,
        "managerPercent" double precision,
        "stockQty" integer NOT NULL DEFAULT 0,
        "isCombo" boolean NOT NULL DEFAULT false,
        "comboItems" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_products_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_product_categories_name" UNIQUE ("name"),
        CONSTRAINT "PK_product_categories_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "inventory_movements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "productId" character varying NOT NULL,
        "productName" character varying NOT NULL,
        "branchName" character varying,
        "type" character varying NOT NULL,
        "operationType" character varying NOT NULL DEFAULT 'other',
        "quantity" integer NOT NULL,
        "stockAfter" integer NOT NULL,
        "reason" character varying,
        "actorId" character varying,
        "actorName" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_inventory_movements_id" PRIMARY KEY ("id")
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
        "discount" double precision,
        "branch" character varying NOT NULL DEFAULT 'Центральный',
        "paymentType" character varying NOT NULL DEFAULT 'cash',
        "paymentLabel" character varying,
        "hybridCash" double precision,
        "hybridCard" double precision,
        "hybridTransfer" double precision,
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
        "bookingBuyout" double precision,
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

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "app_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "companyName" character varying NOT NULL DEFAULT 'TOMSTORE',
        "companyLogoUrl" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_app_settings_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      INSERT INTO "app_settings" ("companyName")
      SELECT 'TOMSTORE'
      WHERE NOT EXISTS (SELECT 1 FROM "app_settings")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "training_materials" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text,
        "type" character varying NOT NULL DEFAULT 'other',
        "url" text NOT NULL,
        "folderId" character varying,
        "lessonOrder" integer NOT NULL DEFAULT 0,
        "thumbnailUrl" text,
        "createdById" character varying,
        "createdByName" character varying,
        "isPublished" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_training_materials_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "training_material_folders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_training_material_folders_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_training_materials_folderId"
      ON "training_materials" ("folderId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_training_materials_folderId"');
    await queryRunner.query('DROP TABLE IF EXISTS "training_material_folders"');
    await queryRunner.query('DROP TABLE IF EXISTS "training_materials"');
    await queryRunner.query('DROP TABLE IF EXISTS "app_settings"');
    await queryRunner.query('DROP TABLE IF EXISTS "targets"');
    await queryRunner.query('DROP TABLE IF EXISTS "expenses"');
    await queryRunner.query('DROP TABLE IF EXISTS "bonuses"');
    await queryRunner.query('DROP TABLE IF EXISTS "sales"');
    await queryRunner.query('DROP TABLE IF EXISTS "inventory_movements"');
    await queryRunner.query('DROP TABLE IF EXISTS "product_categories"');
    await queryRunner.query('DROP TABLE IF EXISTS "suppliers"');
    await queryRunner.query('DROP TABLE IF EXISTS "branches"');
    await queryRunner.query('DROP TABLE IF EXISTS "products"');
    await queryRunner.query('DROP TABLE IF EXISTS "users"');
  }
}
