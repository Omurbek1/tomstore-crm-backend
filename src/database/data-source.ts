import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { BonusTargetEntity } from './entities/bonus-target.entity';
import { BonusEntity } from './entities/bonus.entity';
import { ExpenseEntity } from './entities/expense.entity';
import { ProductEntity } from './entities/product.entity';
import { SaleEntity } from './entities/sale.entity';
import { SupplierEntity } from './entities/supplier.entity';
import { UserEntity } from './entities/user.entity';
import { InitSchema1730000000000 } from './migrations/1730000000000-InitSchema';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? process.env.DB_DATABASE ?? 'tomstore',
  entities: [
    UserEntity,
    ProductEntity,
    SaleEntity,
    SupplierEntity,
    BonusEntity,
    ExpenseEntity,
    BonusTargetEntity,
  ],
  migrations: [InitSchema1730000000000],
  synchronize: false,
});
