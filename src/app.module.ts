import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { BranchesModule } from './branches/branches.module';
import { BonusesModule } from './bonuses/bonuses.module';
import { BranchEntity } from './database/entities/branch.entity';
import { ExpenseEntity } from './database/entities/expense.entity';
import { BonusEntity } from './database/entities/bonus.entity';
import { BonusTargetEntity } from './database/entities/bonus-target.entity';
import { ProductEntity } from './database/entities/product.entity';
import { ProductCategoryEntity } from './database/entities/product-category.entity';
import { AppSettingEntity } from './database/entities/app-setting.entity';
import { TrainingMaterialFolderEntity } from './database/entities/training-material-folder.entity';
import { TrainingMaterialEntity } from './database/entities/training-material.entity';
import { SaleEntity } from './database/entities/sale.entity';
import { SupplierEntity } from './database/entities/supplier.entity';
import { UserEntity } from './database/entities/user.entity';
import { InventoryMovementEntity } from './database/entities/inventory-movement.entity';
import { ExpensesModule } from './expenses/expenses.module';
import { InventoryModule } from './inventory/inventory.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { TargetsModule } from './targets/targets.module';
import { UploadsModule } from './uploads/uploads.module';
import { UsersModule } from './users/users.module';
import { SettingsModule } from './settings/settings.module';
import { MaterialsModule } from './materials/materials.module';
import { InitSchema1730000000000 } from './database/migrations/1730000000000-InitSchema';
import { AddProductManagerPercent1730000000001 } from './database/migrations/1730000000001-AddProductManagerPercent';
import { AddProductMediaAndCharacteristics1730000000002 } from './database/migrations/1730000000002-AddProductMediaAndCharacteristics';
import { AddSupplierAddress1730000000003 } from './database/migrations/1730000000003-AddSupplierAddress';
import { AddUsersDeletedFlag1730000000004 } from './database/migrations/1730000000004-AddUsersDeletedFlag';
import { AddUserProfileFields1730000000005 } from './database/migrations/1730000000005-AddUserProfileFields';
import { AddUserBirthDateAndPhoto1730000000006 } from './database/migrations/1730000000006-AddUserBirthDateAndPhoto';
import { AddInventory1730000000007 } from './database/migrations/1730000000007-AddInventory';
import { AddComboProducts1730000000008 } from './database/migrations/1730000000008-AddComboProducts';
import { AddProductPhotoUrls1730000000009 } from './database/migrations/1730000000009-AddProductPhotoUrls';
import { AddProductCategories1730000000010 } from './database/migrations/1730000000010-AddProductCategories';
import { AddSaleDiscount1730000000011 } from './database/migrations/1730000000011-AddSaleDiscount';
import { AddBranchesAndUserBranch1730000000012 } from './database/migrations/1730000000012-AddBranchesAndUserBranch';
import { AddProductAndInventoryBranch1730000000013 } from './database/migrations/1730000000013-AddProductAndInventoryBranch';
import { AddPaymentDetails1730000000014 } from './database/migrations/1730000000014-AddPaymentDetails';
import { AddBookingBuyout1730000000015 } from './database/migrations/1730000000015-AddBookingBuyout';
import { AddProductCategoryDictionary1730000000016 } from './database/migrations/1730000000016-AddProductCategoryDictionary';
import { AddInventoryOperationType1730000000017 } from './database/migrations/1730000000017-AddInventoryOperationType';
import { AddSettingsAndMaterials1730000000018 } from './database/migrations/1730000000018-AddSettingsAndMaterials';
import { AddMaterialFoldersAndLessonOrder1730000000019 } from './database/migrations/1730000000019-AddMaterialFoldersAndLessonOrder';
import { AddUserMultiRoleAndFixedSalary1730000000020 } from './database/migrations/1730000000020-AddUserMultiRoleAndFixedSalary';
import { AddTargetRewardIssueState1730000000021 } from './database/migrations/1730000000021-AddTargetRewardIssueState';
import { AddTargetRewardTypeAndText1730000000022 } from './database/migrations/1730000000022-AddTargetRewardTypeAndText';

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
        ProductCategoryEntity,
        AppSettingEntity,
        TrainingMaterialFolderEntity,
        TrainingMaterialEntity,
        BranchEntity,
        SaleEntity,
        SupplierEntity,
        BonusEntity,
        ExpenseEntity,
        BonusTargetEntity,
        InventoryMovementEntity,
      ],
      migrations: [
        InitSchema1730000000000,
        AddProductManagerPercent1730000000001,
        AddProductMediaAndCharacteristics1730000000002,
        AddSupplierAddress1730000000003,
        AddUsersDeletedFlag1730000000004,
        AddUserProfileFields1730000000005,
        AddUserBirthDateAndPhoto1730000000006,
        AddInventory1730000000007,
        AddComboProducts1730000000008,
        AddProductPhotoUrls1730000000009,
        AddProductCategories1730000000010,
        AddSaleDiscount1730000000011,
        AddBranchesAndUserBranch1730000000012,
        AddProductAndInventoryBranch1730000000013,
        AddPaymentDetails1730000000014,
        AddBookingBuyout1730000000015,
        AddProductCategoryDictionary1730000000016,
        AddInventoryOperationType1730000000017,
        AddSettingsAndMaterials1730000000018,
        AddMaterialFoldersAndLessonOrder1730000000019,
        AddUserMultiRoleAndFixedSalary1730000000020,
        AddTargetRewardIssueState1730000000021,
        AddTargetRewardTypeAndText1730000000022,
      ],
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
    UploadsModule,
    InventoryModule,
    BranchesModule,
    SettingsModule,
    MaterialsModule,
  ],
})
export class AppModule {}
