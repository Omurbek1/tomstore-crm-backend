import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { BonusTargetEntity } from './entities/bonus-target.entity';
import { BonusEntity } from './entities/bonus.entity';
import { BranchEntity } from './entities/branch.entity';
import { ExpenseEntity } from './entities/expense.entity';
import { ProductEntity } from './entities/product.entity';
import { ProductCategoryEntity } from './entities/product-category.entity';
import { AppSettingEntity } from './entities/app-setting.entity';
import { TrainingMaterialFolderEntity } from './entities/training-material-folder.entity';
import { TrainingMaterialEntity } from './entities/training-material.entity';
import { SaleEntity } from './entities/sale.entity';
import { SupplierEntity } from './entities/supplier.entity';
import { UserEntity } from './entities/user.entity';
import { InventoryMovementEntity } from './entities/inventory-movement.entity';
import { RepairTicketEntity } from './entities/repair-ticket.entity';
import { RepairEventEntity } from './entities/repair-event.entity';
import { CashShiftEntity } from './entities/cash-shift.entity';
import { TaskEntity } from './entities/task.entity';
import { MarketingKpiEntity } from './entities/marketing-kpi.entity';
import { AiMemoryEntity } from './entities/ai-memory.entity';
import { InitSchema1730000000000 } from './migrations/1730000000000-InitSchema';
import { AddProductManagerPercent1730000000001 } from './migrations/1730000000001-AddProductManagerPercent';
import { AddProductMediaAndCharacteristics1730000000002 } from './migrations/1730000000002-AddProductMediaAndCharacteristics';
import { AddSupplierAddress1730000000003 } from './migrations/1730000000003-AddSupplierAddress';
import { AddUsersDeletedFlag1730000000004 } from './migrations/1730000000004-AddUsersDeletedFlag';
import { AddUserProfileFields1730000000005 } from './migrations/1730000000005-AddUserProfileFields';
import { AddUserBirthDateAndPhoto1730000000006 } from './migrations/1730000000006-AddUserBirthDateAndPhoto';
import { AddInventory1730000000007 } from './migrations/1730000000007-AddInventory';
import { AddComboProducts1730000000008 } from './migrations/1730000000008-AddComboProducts';
import { AddProductPhotoUrls1730000000009 } from './migrations/1730000000009-AddProductPhotoUrls';
import { AddProductCategories1730000000010 } from './migrations/1730000000010-AddProductCategories';
import { AddSaleDiscount1730000000011 } from './migrations/1730000000011-AddSaleDiscount';
import { AddBranchesAndUserBranch1730000000012 } from './migrations/1730000000012-AddBranchesAndUserBranch';
import { AddProductAndInventoryBranch1730000000013 } from './migrations/1730000000013-AddProductAndInventoryBranch';
import { AddPaymentDetails1730000000014 } from './migrations/1730000000014-AddPaymentDetails';
import { AddBookingBuyout1730000000015 } from './migrations/1730000000015-AddBookingBuyout';
import { AddProductCategoryDictionary1730000000016 } from './migrations/1730000000016-AddProductCategoryDictionary';
import { AddInventoryOperationType1730000000017 } from './migrations/1730000000017-AddInventoryOperationType';
import { AddSettingsAndMaterials1730000000018 } from './migrations/1730000000018-AddSettingsAndMaterials';
import { AddMaterialFoldersAndLessonOrder1730000000019 } from './migrations/1730000000019-AddMaterialFoldersAndLessonOrder';
import { AddUserMultiRoleAndFixedSalary1730000000020 } from './migrations/1730000000020-AddUserMultiRoleAndFixedSalary';
import { AddTargetRewardIssueState1730000000021 } from './migrations/1730000000021-AddTargetRewardIssueState';
import { AddTargetRewardTypeAndText1730000000022 } from './migrations/1730000000022-AddTargetRewardTypeAndText';
import { AddUserCanManageProducts1730000000023 } from './migrations/1730000000023-AddUserCanManageProducts';
import { AddRepairs1730000000024 } from './migrations/1730000000024-AddRepairs';
import { AddProductBarcode1730000000025 } from './migrations/1730000000025-AddProductBarcode';
import { AddCashShifts1730000000026 } from './migrations/1730000000026-AddCashShifts';
import { AddSaleShiftId1730000000027 } from './migrations/1730000000027-AddSaleShiftId';
import { AddCashShiftDebtFields1730000000028 } from './migrations/1730000000028-AddCashShiftDebtFields';
import { AddSettingsManualPaymentTypes1730000000029 } from './migrations/1730000000029-AddSettingsManualPaymentTypes';
import { AddTasks1730000000030 } from './migrations/1730000000030-AddTasks';
import { AddMarketingKpi1730000000031 } from './migrations/1730000000031-AddMarketingKpi';
import { AddMarketingKpiPlanModeAndItems1730000000032 } from './migrations/1730000000032-AddMarketingKpiPlanModeAndItems';
import { AddTargetStartDate1730000000033 } from './migrations/1730000000033-AddTargetStartDate';
import { AddAiMemory1730000000034 } from './migrations/1730000000034-AddAiMemory';

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
  ],
  synchronize: false,
});
