import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryMovementEntity } from '../database/entities/inventory-movement.entity';
import { AppSettingEntity } from '../database/entities/app-setting.entity';
import { CashShiftEntity } from '../database/entities/cash-shift.entity';
import { ClientEntity } from '../database/entities/client.entity';
import { ClientLoyaltyTransactionEntity } from '../database/entities/client-loyalty-transaction.entity';
import { ClientPromotionEntity } from '../database/entities/client-promotion.entity';
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
  private saleCommentColumnEnsured = false;
  private saleDeliveryPayerColumnEnsured = false;
  private saleClientColumnsEnsured = false;
  private saleCashbackColumnsEnsured = false;

  constructor(
    @InjectRepository(SaleEntity)
    private readonly salesRepo: Repository<SaleEntity>,
    @InjectRepository(ProductEntity)
    private readonly productsRepo: Repository<ProductEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(ClientEntity)
    private readonly clientsRepo: Repository<ClientEntity>,
    @InjectRepository(ClientLoyaltyTransactionEntity)
    private readonly loyaltyRepo: Repository<ClientLoyaltyTransactionEntity>,
    @InjectRepository(ClientPromotionEntity)
    private readonly promotionsRepo: Repository<ClientPromotionEntity>,
    @InjectRepository(CashShiftEntity)
    private readonly shiftsRepo: Repository<CashShiftEntity>,
    @InjectRepository(AppSettingEntity)
    private readonly settingsRepo: Repository<AppSettingEntity>,
  ) {}

  private async ensureSaleCommentColumn() {
    if (this.saleCommentColumnEnsured) return;
    await this.salesRepo.query(
      `ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "comment" text`,
    );
    this.saleCommentColumnEnsured = true;
  }

  private async ensureSaleDeliveryPayerColumn() {
    if (this.saleDeliveryPayerColumnEnsured) return;
    await this.salesRepo.query(
      `ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "deliveryPaidByCompany" boolean`,
    );
    this.saleDeliveryPayerColumnEnsured = true;
  }

  private async ensureSaleClientColumns() {
    if (this.saleClientColumnsEnsured) return;
    await this.salesRepo.query(
      `ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "clientId" character varying`,
    );
    await this.salesRepo.query(
      `ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "loyaltyDiscountPercent" double precision`,
    );
    this.saleClientColumnsEnsured = true;
  }

  private async ensureSaleCashbackColumns() {
    if (this.saleCashbackColumnsEnsured) return;
    await this.salesRepo.query(
      `ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "cashbackUsed" double precision`,
    );
    await this.salesRepo.query(
      `ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "cashbackAccrued" double precision`,
    );
    this.saleCashbackColumnsEnsured = true;
  }

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

  async findAll(params?: SalesFindParams) {
    await this.ensureSaleCommentColumn();
    await this.ensureSaleDeliveryPayerColumn();
    await this.ensureSaleClientColumns();
    await this.ensureSaleCashbackColumns();
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
        '(LOWER(sale.productName) LIKE :q OR LOWER(COALESCE(sale.clientName, \'\')) LIKE :q OR LOWER(COALESCE(sale.comment, \'\')) LIKE :q)',
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
    await this.ensureSaleCommentColumn();
    await this.ensureSaleDeliveryPayerColumn();
    await this.ensureSaleClientColumns();
    await this.ensureSaleCashbackColumns();
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
    const requestedDiscount = Math.max(0, Number(payload.discount ?? 0));
    const subtotal = Math.max(0, price * quantity);

    const normalizeDigits = (value?: string | null) =>
      String(value || '').replace(/\D/g, '');
    const normalizedPhone = normalizeDigits(payload.clientPhone);
    let matchedClient: ClientEntity | null = null;
    if (payload.clientId) {
      matchedClient = await this.clientsRepo.findOne({
        where: { id: payload.clientId, isActive: true },
      });
    }
    if (!matchedClient && normalizedPhone) {
      const clients = await this.clientsRepo.find({ where: { isActive: true }, take: 600 });
      matchedClient =
        clients.find((c) => normalizeDigits(c.phone) === normalizedPhone) || null;
    }

    const saleDate = payload.manualDate ? new Date(payload.manualDate) : new Date();
    const baseClientDiscountPercent = Math.max(
      0,
      Number(matchedClient?.discountPercent || 0),
    );
    let birthdayDiscountPercent = 0;
    if (matchedClient?.birthDate) {
      const birthDate = new Date(matchedClient.birthDate);
      if (
        !Number.isNaN(saleDate.getTime()) &&
        !Number.isNaN(birthDate.getTime()) &&
        saleDate.getUTCMonth() === birthDate.getUTCMonth() &&
        saleDate.getUTCDate() === birthDate.getUTCDate()
      ) {
        birthdayDiscountPercent = Math.max(
          0,
          Number(matchedClient.birthdayDiscountPercent || 0),
        );
      }
    }
    const activePromotions = matchedClient
      ? await this.promotionsRepo.find({
          where: [{ clientId: matchedClient.id }, { clientId: null as unknown as string }],
          order: { createdAt: 'DESC' },
          take: 100,
        })
      : [];
    const promoDiscountPercent = activePromotions
      .filter((promo) => {
        if (!promo.isActive) return false;
        const startsAt = promo.startsAt ? new Date(promo.startsAt) : null;
        const endsAt = promo.endsAt ? new Date(promo.endsAt) : null;
        if (startsAt && saleDate < startsAt) return false;
        if (endsAt && saleDate > endsAt) return false;
        return true;
      })
      .reduce((max, promo) => Math.max(max, Number(promo.discountPercent || 0)), 0);
    const loyaltyDiscountPercent = Math.min(
      100,
      baseClientDiscountPercent + birthdayDiscountPercent + promoDiscountPercent,
    );
    const loyaltyDiscountAmount = Math.round(
      ((subtotal * loyaltyDiscountPercent) / 100) * 100,
    ) / 100;
    const discount = Math.max(requestedDiscount, loyaltyDiscountAmount);
    const discountDelta = Math.max(0, discount - requestedDiscount);
    const incomingTotal = Number(payload.total ?? Math.max(0, subtotal - requestedDiscount));
    const totalBeforeCashback = Math.max(0, incomingTotal - discountDelta);
    const cashbackToUseRequested = Math.max(
      0,
      Number((payload as Partial<SaleEntity> & { cashbackToUse?: number }).cashbackToUse || 0),
    );
    const cashbackToUse = matchedClient
      ? Math.min(
          cashbackToUseRequested,
          matchedClient.bonusesBlocked ? 0 : Number(matchedClient.cashbackBalance || 0),
          totalBeforeCashback,
        )
      : 0;
    const resolvedTotal = Math.max(0, totalBeforeCashback - cashbackToUse);
    const baseTotal = Math.max(0, subtotal - discount);
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
        comment: payload.comment ? String(payload.comment).trim() : undefined,
        clientId: payload.clientId ?? matchedClient?.id ?? undefined,
        productId: payload.productId ?? '',
        productName: payload.productName ?? currentProduct?.name ?? '',
        supplierSnapshot: payload.supplierSnapshot ?? currentProduct?.supplier,
        costPriceSnapshot: costPricePerUnit,
        price,
        quantity,
        total: resolvedTotal,
        discount,
        loyaltyDiscountPercent,
        cashbackUsed: cashbackToUse > 0 ? cashbackToUse : undefined,
        cashbackAccrued: 0,
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
        deliveryPaidByCompany:
          payload.saleType === 'delivery'
            ? payload.deliveryPaidByCompany === undefined
              ? !(resolvedTotal > baseTotal + 0.01)
              : Boolean(payload.deliveryPaidByCompany)
            : false,
      });

      const savedSale = await trx.save(SaleEntity, sale);

      if (matchedClient) {
        const now = new Date();
        const wasExpired =
          matchedClient.cashbackExpiresAt &&
          new Date(matchedClient.cashbackExpiresAt).getTime() < now.getTime() &&
          Number(matchedClient.cashbackBalance || 0) > 0;
        let cashbackBalance = wasExpired ? 0 : Number(matchedClient.cashbackBalance || 0);
        if (wasExpired) {
          await trx.save(
            ClientLoyaltyTransactionEntity,
            trx.create(ClientLoyaltyTransactionEntity, {
              clientId: matchedClient.id,
              type: 'cashback_expire',
              amount: Number(matchedClient.cashbackBalance || 0),
              expiresAt: now,
              note: 'Срок действия кэшбека истек',
            }),
          );
        }

        const cashbackSpend = Math.min(cashbackToUse, cashbackBalance, Number(savedSale.total || 0) + cashbackToUse);
        cashbackBalance = Math.max(0, cashbackBalance - cashbackSpend);
        if (cashbackSpend > 0) {
          await trx.save(
            ClientLoyaltyTransactionEntity,
            trx.create(ClientLoyaltyTransactionEntity, {
              clientId: matchedClient.id,
              type: 'cashback_spend',
              amount: cashbackSpend,
              saleId: savedSale.id,
              note: 'Списание кэшбека при продаже',
            }),
          );
        }

        const canAccrue = !matchedClient.bonusesBlocked;
        const cashbackRatePercent = Math.max(0, Number(matchedClient.cashbackRatePercent || 0));
        const cashbackAccrued = canAccrue
          ? Math.round(((Number(savedSale.total || 0) * cashbackRatePercent) / 100) * 100) / 100
          : 0;
        if (cashbackAccrued > 0) {
          cashbackBalance += cashbackAccrued;
          await trx.save(
            ClientLoyaltyTransactionEntity,
            trx.create(ClientLoyaltyTransactionEntity, {
              clientId: matchedClient.id,
              type: 'cashback_accrual',
              amount: cashbackAccrued,
              saleId: savedSale.id,
              note: 'Начисление кэшбека',
              expiresAt: new Date(
                now.getTime() +
                  Math.max(1, Number(matchedClient.cashbackExpiryDays || 180)) *
                    24 *
                    60 *
                    60 *
                    1000,
              ),
            }),
          );
        }

        const totalSpent = Math.max(0, Number(matchedClient.totalSpent || 0) + Number(savedSale.total || 0));
        const level: ClientEntity['level'] =
          totalSpent >= 1200000 ? 'vip' : totalSpent >= 400000 ? 'gold' : 'silver';
        const cashbackExpiresAt =
          cashbackAccrued > 0
            ? new Date(
                now.getTime() +
                  Math.max(1, Number(matchedClient.cashbackExpiryDays || 180)) *
                    24 *
                    60 *
                    60 *
                    1000,
              )
            : wasExpired
              ? null
              : matchedClient.cashbackExpiresAt || null;

        await trx.update(ClientEntity, matchedClient.id, {
          cashbackBalance,
          cashbackExpiresAt,
          totalSpent,
          level,
        });

        if (cashbackAccrued > 0) {
          await trx.update(SaleEntity, savedSale.id, { cashbackAccrued });
          savedSale.cashbackAccrued = cashbackAccrued;
        }

        const referrerId = matchedClient.referredByClientId
          ? String(matchedClient.referredByClientId).trim()
          : '';
        if (referrerId) {
          const referrer = await trx.findOne(ClientEntity, { where: { id: referrerId, isActive: true } });
          if (referrer && !referrer.bonusesBlocked) {
            const referralBonus = Math.round(cashbackAccrued * 0.1 * 100) / 100;
            if (referralBonus > 0) {
              await trx.update(ClientEntity, referrer.id, {
                cashbackBalance: Math.max(0, Number(referrer.cashbackBalance || 0) + referralBonus),
                cashbackExpiresAt: new Date(
                  now.getTime() +
                    Math.max(1, Number(referrer.cashbackExpiryDays || 180)) *
                      24 *
                      60 *
                      60 *
                      1000,
                ),
              });
              await trx.save(
                ClientLoyaltyTransactionEntity,
                trx.create(ClientLoyaltyTransactionEntity, {
                  clientId: referrer.id,
                  type: 'referral_bonus',
                  amount: referralBonus,
                  saleId: savedSale.id,
                  note: `Реферальный бонус за клиента ${matchedClient.fullName}`,
                }),
              );
            }
          }
        }
      }

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
    await this.ensureSaleCommentColumn();
    await this.ensureSaleDeliveryPayerColumn();
    await this.ensureSaleClientColumns();
    await this.ensureSaleCashbackColumns();
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
