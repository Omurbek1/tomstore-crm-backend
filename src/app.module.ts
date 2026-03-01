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
import { ClientEntity } from './database/entities/client.entity';
import { ClientLoyaltyTransactionEntity } from './database/entities/client-loyalty-transaction.entity';
import { ClientPromotionEntity } from './database/entities/client-promotion.entity';
import { ClientSmsLogEntity } from './database/entities/client-sms-log.entity';
import { InventoryMovementEntity } from './database/entities/inventory-movement.entity';
import { RepairTicketEntity } from './database/entities/repair-ticket.entity';
import { RepairEventEntity } from './database/entities/repair-event.entity';
import { CashShiftEntity } from './database/entities/cash-shift.entity';
import { TaskEntity } from './database/entities/task.entity';
import { MarketingKpiEntity } from './database/entities/marketing-kpi.entity';
import { AiMemoryEntity } from './database/entities/ai-memory.entity';
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
import { AddUserCanManageProducts1730000000023 } from './database/migrations/1730000000023-AddUserCanManageProducts';
import { AddRepairs1730000000024 } from './database/migrations/1730000000024-AddRepairs';
import { AddProductBarcode1730000000025 } from './database/migrations/1730000000025-AddProductBarcode';
import { AddCashShifts1730000000026 } from './database/migrations/1730000000026-AddCashShifts';
import { AddSaleShiftId1730000000027 } from './database/migrations/1730000000027-AddSaleShiftId';
import { RepairsModule } from './repairs/repairs.module';
import { CashShiftsModule } from './cash-shifts/cash-shifts.module';
import { TasksModule } from './tasks/tasks.module';
import { AddCashShiftDebtFields1730000000028 } from './database/migrations/1730000000028-AddCashShiftDebtFields';
import { AddSettingsManualPaymentTypes1730000000029 } from './database/migrations/1730000000029-AddSettingsManualPaymentTypes';
import { AddTasks1730000000030 } from './database/migrations/1730000000030-AddTasks';
import { AddMarketingKpi1730000000031 } from './database/migrations/1730000000031-AddMarketingKpi';
import { AddMarketingKpiPlanModeAndItems1730000000032 } from './database/migrations/1730000000032-AddMarketingKpiPlanModeAndItems';
import { AddTargetStartDate1730000000033 } from './database/migrations/1730000000033-AddTargetStartDate';
import { AddAiMemory1730000000034 } from './database/migrations/1730000000034-AddAiMemory';
import { AddSaleComment1730000000035 } from './database/migrations/1730000000035-AddSaleComment';
import { AddSaleDeliveryPayer1730000000036 } from './database/migrations/1730000000036-AddSaleDeliveryPayer';
import { AddClients1730000000037 } from './database/migrations/1730000000037-AddClients';
import { AddClientLoyalty1730000000038 } from './database/migrations/1730000000038-AddClientLoyalty';
import { AddTaskAttachments1730000000039 } from './database/migrations/1730000000039-AddTaskAttachments';
import { AddSupplierMediaLinks1730000000040 } from './database/migrations/1730000000040-AddSupplierMediaLinks';
import { AddSupplierImageUrls1730000000041 } from './database/migrations/1730000000041-AddSupplierImageUrls';
import { AddUserManagedBranches1730000000042 } from './database/migrations/1730000000042-AddUserManagedBranches';
import { MarketingKpiModule } from './marketing-kpi/marketing-kpi.module';
import { AiModule } from './ai/ai.module';
import { ClientsModule } from './clients/clients.module';

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
        RepairTicketEntity,
        RepairEventEntity,
        CashShiftEntity,
        TaskEntity,
        MarketingKpiEntity,
        AiMemoryEntity,
        ClientEntity,
        ClientLoyaltyTransactionEntity,
        ClientPromotionEntity,
        ClientSmsLogEntity,
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
        AddUserCanManageProducts1730000000023,
        AddRepairs1730000000024,
        AddProductBarcode1730000000025,
        AddCashShifts1730000000026,
        AddSaleShiftId1730000000027,
        AddCashShiftDebtFields1730000000028,
        AddSettingsManualPaymentTypes1730000000029,
        AddTasks1730000000030,
        AddMarketingKpi1730000000031,
        AddMarketingKpiPlanModeAndItems1730000000032,
        AddTargetStartDate1730000000033,
        AddAiMemory1730000000034,
        AddSaleComment1730000000035,
        AddSaleDeliveryPayer1730000000036,
        AddClients1730000000037,
        AddClientLoyalty1730000000038,
        AddTaskAttachments1730000000039,
        AddSupplierMediaLinks1730000000040,
        AddSupplierImageUrls1730000000041,
        AddUserManagedBranches1730000000042,
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
    RepairsModule,
    CashShiftsModule,
    TasksModule,
    MarketingKpiModule,
    AiModule,
    ClientsModule,
  ],
})
export class AppModule {}
