import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryMovementEntity } from '../database/entities/inventory-movement.entity';
import { AppSettingEntity } from '../database/entities/app-setting.entity';
import { CashShiftEntity } from '../database/entities/cash-shift.entity';
import { ProductEntity } from '../database/entities/product.entity';
import { SaleEntity } from '../database/entities/sale.entity';
import { UserEntity } from '../database/entities/user.entity';

const ALLOWED_INSTALLMENT_MONTHS: Record<string, number[]> = {
  Зеро: [3, 8, 12],
  МПЛБС: [3, 6],
  Тумар: [3],
  Мислам: [4],
  МКК: [3, 6, 9],
};

type SalesFindParams = {
  limit?: number;
  offset?: number;
  all?: boolean;
  managerId?: string;
  branch?: string;
  shiftId?: string;
  paymentType?: string;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
};

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(SaleEntity)
    private readonly salesRepo: Repository<SaleEntity>,
    @InjectRepository(ProductEntity)
    private readonly productsRepo: Repository<ProductEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(CashShiftEntity)
    private readonly shiftsRepo: Repository<CashShiftEntity>,
    @InjectRepository(AppSettingEntity)
    private readonly settingsRepo: Repository<AppSettingEntity>,
  ) {}

  private async ensureManualPaymentTypesColumn() {
    await this.settingsRepo.query(
      `ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "manualPaymentTypes" text[] NOT NULL DEFAULT '{}'`,
    );
  }

  private async getManualPaymentTypes(): Promise<string[]> {
    await this.ensureManualPaymentTypesColumn();
    const [settings] = await this.settingsRepo.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });
    if (!settings?.manualPaymentTypes?.length) return [];
    const values = settings.manualPaymentTypes
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .filter((item) => {
        const lower = item.toLowerCase();
        return lower !== 'hybrid' && lower !== 'гибрид';
      });
    return Array.from(new Set(values));
  }

  findAll(params?: SalesFindParams) {
    const take = Math.max(1, Math.min(500, Number(params?.limit ?? 200)));
    const skip = Math.max(0, Number(params?.offset ?? 0));
    const qb = this.salesRepo
      .createQueryBuilder('sale')
      .orderBy('sale.createdAt', 'DESC');

    if (params?.managerId?.trim()) {
      qb.andWhere('sale.managerId = :managerId', {
        managerId: params.managerId.trim(),
      });
    }
    if (params?.branch?.trim()) {
      qb.andWhere('sale.branch = :branch', { branch: params.branch.trim() });
    }
    if (params?.shiftId?.trim()) {
      qb.andWhere('sale.shiftId = :shiftId', { shiftId: params.shiftId.trim() });
    }
    if (params?.paymentType?.trim()) {
      qb.andWhere('sale.paymentType = :paymentType', {
        paymentType: params.paymentType.trim(),
      });
    }
    if (params?.q?.trim()) {
      const q = `%${params.q.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(sale.productName) LIKE :q OR LOWER(COALESCE(sale.clientName, \'\')) LIKE :q)',
        { q },
      );
    }
    if (params?.dateFrom) {
      const dateFrom = new Date(params.dateFrom);
      if (!Number.isNaN(dateFrom.getTime())) {
        qb.andWhere('sale.createdAt >= :dateFrom', { dateFrom });
      }
    }
    if (params?.dateTo) {
      const dateTo = new Date(params.dateTo);
      if (!Number.isNaN(dateTo.getTime())) {
        qb.andWhere('sale.createdAt <= :dateTo', { dateTo });
      }
    }

    if (!params?.all) {
      qb.take(take).skip(skip);
    }
    return qb.getMany();
  }

  async create(payload: Partial<SaleEntity>) {
    const product = payload.productId
      ? await this.productsRepo.findOne({ where: { id: payload.productId } })
      : null;
    const manager = payload.managerId
      ? await this.usersRepo.findOne({ where: { id: payload.managerId } })
      : null;
    const isFixedSalarySeller =
      manager?.salaryType === 'fixed' ||
      manager?.role === 'cashier' ||
      manager?.role === 'storekeeper' ||
      manager?.roles?.includes('cashier') ||
      manager?.roles?.includes('storekeeper');

    const quantity = Number(payload.quantity ?? 1);
    const price = Number(payload.price ?? product?.sellingPrice ?? 0);
    const discount = Math.max(0, Number(payload.discount ?? 0));
    const resolvedTotal = Number(
      payload.total ?? Math.max(0, price * quantity - discount),
    );
    const hybridCash = Math.max(0, Number(payload.hybridCash ?? 0));
    const hybridCard = Math.max(0, Number(payload.hybridCard ?? 0));
    const hybridTransfer = Math.max(0, Number(payload.hybridTransfer ?? 0));
    const installmentMonths = Number(payload.installmentMonths ?? 0);
    const paymentLabel = String(payload.paymentLabel ?? '').trim();
    const bookingDeposit = Number(payload.bookingDeposit ?? 0);
    const bookingBuyout = Number(payload.bookingBuyout ?? 0);
    const shiftId = payload.shiftId ? String(payload.shiftId).trim() : undefined;
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException('Количество должно быть больше 0');
    }
    if (payload.paymentType === 'installment') {
      const allowedMonths = ALLOWED_INSTALLMENT_MONTHS[paymentLabel];
      if (!allowedMonths) {
        throw new BadRequestException(
          'Для рассрочки укажите валидного провайдера',
        );
      }
      if (!allowedMonths.includes(installmentMonths)) {
        throw new BadRequestException(
          `Недопустимый срок рассрочки для ${paymentLabel}`,
        );
      }
    }
    if (payload.paymentType === 'booking') {
      if (!Number.isFinite(bookingDeposit) || bookingDeposit < 0) {
        throw new BadRequestException('Предоплата брони указана некорректно');
      }
      if (!Number.isFinite(bookingBuyout) || bookingBuyout < 0) {
        throw new BadRequestException('Выкуп брони указан некорректно');
      }
      if (
        payload.saleType === 'delivery' &&
        Math.abs((bookingDeposit + bookingBuyout) - resolvedTotal) > 0.01
      ) {
        throw new BadRequestException(
          'Для региональной брони сумма предоплаты и выкупа должна совпадать с суммой заказа',
        );
      }
    }
    if (payload.paymentType === 'manual') {
      const allowedManualTypes = await this.getManualPaymentTypes();
      const normalizedLabel = String(payload.paymentLabel || '').trim();
      if (!normalizedLabel) {
        throw new BadRequestException(
          'Для ручного типа оплаты укажите канал оплаты',
        );
      }
      if (
        !allowedManualTypes.some(
          (type) => type.toLowerCase() === normalizedLabel.toLowerCase(),
        )
      ) {
        throw new BadRequestException(
          'Этот ручной тип оплаты недоступен. Добавьте его в Настройках (admin/superadmin).',
        );
      }
    }

    if (shiftId) {
      const shift = await this.shiftsRepo.findOne({ where: { id: shiftId } });
      if (!shift) {
        throw new BadRequestException('Смена не найдена');
      }
      if (shift.status !== 'open') {
        throw new BadRequestException('Смена закрыта');
      }
      if (payload.managerId && shift.cashierId !== payload.managerId) {
        throw new BadRequestException(
          'Продажа не может быть привязана к чужой смене',
        );
      }
    }

    return this.salesRepo.manager.transaction(async (trx) => {
      let currentProduct = product;
      if (payload.productId) {
        currentProduct = await trx.findOne(ProductEntity, {
          where: { id: payload.productId },
        });
      }

      if (payload.productId && !currentProduct) {
        throw new NotFoundException('Товар не найден');
      }
      if (currentProduct?.branchName && payload.branch) {
        if (currentProduct.branchName !== payload.branch) {
          throw new BadRequestException('Товар принадлежит другому филиалу');
        }
      }

      let costPricePerUnit = Number(
        payload.costPriceSnapshot ?? currentProduct?.costPrice ?? 0,
      );

      if (currentProduct?.isCombo && currentProduct.comboItems?.length) {
        const comboItems = currentProduct.comboItems;
        const componentIds = comboItems.map((item) => item.productId);
        const components = await trx.find(ProductEntity, {
          where: componentIds.map((id) => ({ id })),
        });
        const byId = new Map(components.map((p) => [p.id, p]));

        for (const item of comboItems) {
          const component = byId.get(item.productId);
          if (!component) {
            throw new BadRequestException(
              `Комбо содержит несуществующий товар: ${item.productId}`,
            );
          }
          const requiredQty = Number(item.quantity) * quantity;
          const availableStock = Number(component.stockQty ?? 0);
          if (availableStock < requiredQty) {
            throw new BadRequestException(
              `Недостаточно остатка для "${component.name}": доступно ${availableStock}, требуется ${requiredQty}`,
            );
          }
        }

        costPricePerUnit = comboItems.reduce((sum, item) => {
          const component = byId.get(item.productId);
          return sum + Number(component?.costPrice ?? 0) * Number(item.quantity);
        }, 0);

        for (const item of comboItems) {
          const component = byId.get(item.productId)!;
          const requiredQty = Number(item.quantity) * quantity;
          const nextStock = Number(component.stockQty ?? 0) - requiredQty;

          await trx.update(ProductEntity, component.id, { stockQty: nextStock });
          const movement = trx.create(InventoryMovementEntity, {
            productId: component.id,
            productName: component.name,
            branchName: payload.branch ?? currentProduct.branchName,
            type: 'out',
            operationType: 'sale',
            quantity: requiredQty,
            stockAfter: nextStock,
            reason: `Продажа комбо ${currentProduct.name}`,
            actorId: payload.managerId,
            actorName: payload.managerName ?? manager?.name ?? 'Unknown',
          });
          await trx.save(InventoryMovementEntity, movement);
        }
      } else if (currentProduct) {
        const availableStock = Number(currentProduct.stockQty ?? 0);
        if (availableStock < quantity) {
          throw new BadRequestException(
            `Недостаточно остатка: доступно ${availableStock}, требуется ${quantity}`,
          );
        }
        await trx.update(ProductEntity, currentProduct.id, {
          stockQty: availableStock - quantity,
        });
      }

      const sale = trx.create(SaleEntity, {
        clientName: payload.clientName ?? '',
        clientPhone: payload.clientPhone,
        clientAddress: payload.clientAddress,
        productId: payload.productId ?? '',
        productName: payload.productName ?? currentProduct?.name ?? '',
        supplierSnapshot: payload.supplierSnapshot ?? currentProduct?.supplier,
        costPriceSnapshot: costPricePerUnit,
        price,
        quantity,
        total: resolvedTotal,
        discount,
        branch: payload.branch ?? currentProduct?.branchName ?? 'Центральный',
        shiftId,
        paymentType: payload.paymentType ?? 'cash',
        paymentLabel:
          payload.paymentType === 'installment'
            ? paymentLabel
            : payload.paymentLabel,
        hybridCash: payload.paymentType === 'hybrid' ? hybridCash : undefined,
        hybridCard: payload.paymentType === 'hybrid' ? hybridCard : undefined,
        hybridTransfer:
          payload.paymentType === 'hybrid' ? hybridTransfer : undefined,
        installmentMonths:
          payload.paymentType === 'installment'
            ? installmentMonths
            : payload.installmentMonths,
        managerEarnings: isFixedSalarySeller
          ? 0
          : Number(
              payload.managerEarnings ??
                (currentProduct?.managerEarnings
                  ? Number(currentProduct.managerEarnings) * quantity
                  : 0),
            ),
        potentialEarnings: payload.potentialEarnings,
        baseManagerEarnings: payload.baseManagerEarnings,
        deliveryStatus: payload.deliveryStatus ?? 'reserved',
        saleType: payload.saleType ?? 'office',
        managerId: payload.managerId,
        managerName: payload.managerName ?? manager?.name ?? 'Unknown',
        bookingDeadline: payload.bookingDeadline ?? null,
        bookingDeposit:
          payload.bookingDeposit === undefined
            ? null
            : bookingDeposit,
        bookingBuyout:
          payload.bookingBuyout === undefined
            ? null
            : bookingBuyout,
        manualDate: payload.manualDate ?? null,
        updatedBy: payload.updatedBy,
        deliveryCost:
          payload.deliveryCost === undefined ? 0 : Number(payload.deliveryCost),
      });

      const savedSale = await trx.save(SaleEntity, sale);

      if (savedSale.paymentType === 'hybrid') {
        const hybridTotal =
          Number(savedSale.hybridCash || 0) +
          Number(savedSale.hybridCard || 0) +
          Number(savedSale.hybridTransfer || 0);
        if (Math.abs(hybridTotal - Number(savedSale.total || 0)) > 0.01) {
          throw new BadRequestException(
            `Сумма гибридной оплаты (${hybridTotal}) должна быть равна сумме заказа (${savedSale.total})`,
          );
        }
      }

      if (currentProduct) {
        if (currentProduct.isCombo) {
          return savedSale;
        }
        const updatedProduct = await trx.findOneByOrFail(ProductEntity, {
          id: currentProduct.id,
        });
        const movement = trx.create(InventoryMovementEntity, {
          productId: currentProduct.id,
          productName: currentProduct.name,
          branchName: savedSale.branch,
          type: 'out',
          operationType: 'sale',
          quantity,
          stockAfter: Number(updatedProduct.stockQty ?? 0),
          reason: `Продажа ${savedSale.id}`,
          actorId: savedSale.managerId,
          actorName: savedSale.managerName,
        });
        await trx.save(InventoryMovementEntity, movement);
      }

      return savedSale;
    });
  }

  async update(id: string, payload: Partial<SaleEntity>) {
    const found = await this.salesRepo.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException('Продажа не найдена');
    }

    await this.salesRepo.update(id, payload);
    return this.salesRepo.findOneByOrFail({ id });
  }

  async remove(id: string): Promise<{ success: true }> {
    await this.salesRepo.delete(id);
    return { success: true };
  }
}
