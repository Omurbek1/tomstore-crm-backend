import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductCategoryDictionary1730000000016
  implements MigrationInterface
{
  name = 'AddProductCategoryDictionary1730000000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
      INSERT INTO "product_categories" ("name")
      SELECT DISTINCT trim("value")
      FROM (
        SELECT "category" AS "value" FROM "products" WHERE "category" IS NOT NULL
        UNION ALL
        SELECT jsonb_array_elements_text("categories") AS "value"
        FROM "products"
        WHERE "categories" IS NOT NULL
      ) AS "all_values"
      WHERE trim("value") <> ''
      ON CONFLICT ("name") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "product_categories" ("name")
      VALUES
        ('Смартфоны'),
        ('Ноутбуки'),
        ('Планшеты'),
        ('Аксессуары'),
        ('Комплектующие'),
        ('Периферия'),
        ('Сетевое оборудование'),
        ('Бытовая техника'),
        ('Услуги'),
        ('Прочее')
      ON CONFLICT ("name") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "product_categories"');
  }
}

