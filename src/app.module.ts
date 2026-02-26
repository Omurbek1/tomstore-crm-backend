import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { BonusesModule } from './bonuses/bonuses.module';
import { ExpenseEntity } from './database/entities/expense.entity';
import { BonusEntity } from './database/entities/bonus.entity';
import { BonusTargetEntity } from './database/entities/bonus-target.entity';
import { ProductEntity } from './database/entities/product.entity';
import { SaleEntity } from './database/entities/sale.entity';
import { SupplierEntity } from './database/entities/supplier.entity';
import { UserEntity } from './database/entities/user.entity';
import { ExpensesModule } from './expenses/expenses.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { TargetsModule } from './targets/targets.module';
import { UsersModule } from './users/users.module';
import { InitSchema1730000000000 } from './database/migrations/1730000000000-InitSchema';

@Module({
  imports: [
    TypeOrmModule.forRoot({
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
      migrationsRun: true,
      migrationsTableName: 'migrations',
      synchronize: false,
    }),
    AuthModule,
    UsersModule,
    ProductsModule,
    SalesModule,
    SuppliersModule,
    BonusesModule,
    ExpensesModule,
    TargetsModule,
  ],
})
export class AppModule {}
