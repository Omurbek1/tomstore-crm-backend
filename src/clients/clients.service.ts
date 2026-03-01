import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientEntity } from '../database/entities/client.entity';
import { ClientLoyaltyTransactionEntity } from '../database/entities/client-loyalty-transaction.entity';
import { ClientPromotionEntity } from '../database/entities/client-promotion.entity';
import { ClientSmsLogEntity } from '../database/entities/client-sms-log.entity';
import { SaleEntity } from '../database/entities/sale.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(ClientEntity)
    private readonly clientsRepo: Repository<ClientEntity>,
    @InjectRepository(ClientLoyaltyTransactionEntity)
    private readonly loyaltyRepo: Repository<ClientLoyaltyTransactionEntity>,
    @InjectRepository(ClientPromotionEntity)
    private readonly promotionsRepo: Repository<ClientPromotionEntity>,
    @InjectRepository(ClientSmsLogEntity)
    private readonly smsRepo: Repository<ClientSmsLogEntity>,
    @InjectRepository(SaleEntity)
    private readonly salesRepo: Repository<SaleEntity>,
  ) {}

  private generateReferralCode() {
    return `CL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  private async resolveReferrerId(referredByCode?: string): Promise<string | undefined> {
    const code = String(referredByCode || '').trim().toUpperCase();
    if (!code) return undefined;
    const referrer = await this.clientsRepo.findOne({
      where: { referralCode: code, isActive: true },
    });
    return referrer?.id;
  }

  findAll(params?: { q?: string; limit?: number; offset?: number; activeOnly?: boolean }) {
    const take = Math.max(1, Math.min(500, Number(params?.limit ?? 200)));
    const skip = Math.max(0, Number(params?.offset ?? 0));
    const qb = this.clientsRepo.createQueryBuilder('client').orderBy('client.createdAt', 'DESC');

    if (params?.activeOnly) {
      qb.andWhere('client.isActive = true');
    }
    if (params?.q?.trim()) {
      const q = `%${params.q.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(client.fullName) LIKE :q OR LOWER(COALESCE(client.phone, \'\')) LIKE :q)',
        { q },
      );
    }

    return qb.take(take).skip(skip).getMany();
  }

  async create(payload: Partial<ClientEntity> & { referredByCode?: string }) {
    if (!String(payload.fullName || '').trim()) {
      throw new BadRequestException('Укажите ФИО клиента');
    }
    const referredByFromCode = await this.resolveReferrerId(payload.referredByCode);
    const client = this.clientsRepo.create({
      fullName: String(payload.fullName || '').trim(),
      phone: payload.phone ? String(payload.phone).trim() : undefined,
      birthDate: payload.birthDate || undefined,
      discountPercent: Math.max(0, Number(payload.discountPercent || 0)),
      birthdayDiscountPercent: Math.max(0, Number(payload.birthdayDiscountPercent || 0)),
      level:
        payload.level === 'vip' || payload.level === 'gold' ? payload.level : 'silver',
      cashbackRatePercent: Math.max(0, Number(payload.cashbackRatePercent || 0)),
      cashbackBalance: Math.max(0, Number(payload.cashbackBalance || 0)),
      cashbackExpiryDays: Math.max(1, Number(payload.cashbackExpiryDays || 180)),
      bonusesBlocked: Boolean(payload.bonusesBlocked),
      referralCode:
        String(payload.referralCode || '').trim() || this.generateReferralCode(),
      referredByClientId: payload.referredByClientId || referredByFromCode || undefined,
      note: payload.note ? String(payload.note).trim() : undefined,
      isActive: payload.isActive === undefined ? true : Boolean(payload.isActive),
    });
    return this.clientsRepo.save(client);
  }

  async update(id: string, payload: Partial<ClientEntity> & { referredByCode?: string }) {
    const found = await this.clientsRepo.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException('Клиент не найден');
    }
    const referredByFromCode =
      payload.referredByCode !== undefined
        ? await this.resolveReferrerId(payload.referredByCode)
        : undefined;
    await this.clientsRepo.update(id, {
      fullName:
        payload.fullName === undefined ? found.fullName : String(payload.fullName || '').trim(),
      phone: payload.phone === undefined ? found.phone : String(payload.phone || '').trim(),
      birthDate: payload.birthDate === undefined ? found.birthDate : payload.birthDate || undefined,
      discountPercent:
        payload.discountPercent === undefined
          ? found.discountPercent
          : Math.max(0, Number(payload.discountPercent || 0)),
      birthdayDiscountPercent:
        payload.birthdayDiscountPercent === undefined
          ? found.birthdayDiscountPercent
          : Math.max(0, Number(payload.birthdayDiscountPercent || 0)),
      level:
        payload.level === undefined
          ? found.level
          : payload.level === 'vip' || payload.level === 'gold'
            ? payload.level
            : 'silver',
      cashbackRatePercent:
        payload.cashbackRatePercent === undefined
          ? found.cashbackRatePercent
          : Math.max(0, Number(payload.cashbackRatePercent || 0)),
      cashbackBalance:
        payload.cashbackBalance === undefined
          ? found.cashbackBalance
          : Math.max(0, Number(payload.cashbackBalance || 0)),
      cashbackExpiryDays:
        payload.cashbackExpiryDays === undefined
          ? found.cashbackExpiryDays
          : Math.max(1, Number(payload.cashbackExpiryDays || 180)),
      bonusesBlocked:
        payload.bonusesBlocked === undefined
          ? found.bonusesBlocked
          : Boolean(payload.bonusesBlocked),
      referralCode:
        payload.referralCode === undefined
          ? found.referralCode
          : String(payload.referralCode || '').trim() || found.referralCode,
      referredByClientId:
        payload.referredByClientId === undefined
          ? payload.referredByCode === undefined
            ? found.referredByClientId
            : referredByFromCode
          : payload.referredByClientId || undefined,
      note: payload.note === undefined ? found.note : String(payload.note || '').trim(),
      isActive: payload.isActive === undefined ? found.isActive : Boolean(payload.isActive),
    });
    return this.clientsRepo.findOneByOrFail({ id });
  }

  async findByReferralCode(code: string) {
    const normalized = String(code || '').trim().toUpperCase();
    if (!normalized) {
      throw new BadRequestException('Реферальный код пустой');
    }
    const client = await this.clientsRepo.findOne({
      where: { referralCode: normalized, isActive: true },
    });
    if (!client) {
      throw new NotFoundException('Реферальный код не найден');
    }
    return {
      id: client.id,
      fullName: client.fullName,
      referralCode: client.referralCode,
    };
  }

  async remove(id: string): Promise<{ success: true }> {
    const found = await this.clientsRepo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Клиент не найден');
    await this.clientsRepo.update(id, { isActive: false });
    return { success: true };
  }

  async history(clientId: string) {
    const client = await this.clientsRepo.findOne({ where: { id: clientId } });
    if (!client) throw new NotFoundException('Клиент не найден');

    const [sales, loyalty, sms, promotions] = await Promise.all([
      this.salesRepo.find({
        where: [{ clientId }, { clientPhone: client.phone || '' }],
        order: { createdAt: 'DESC' },
        take: 150,
      }),
      this.loyaltyRepo.find({
        where: { clientId },
        order: { createdAt: 'DESC' },
        take: 300,
      }),
      this.smsRepo.find({
        where: { clientId },
        order: { createdAt: 'DESC' },
        take: 100,
      }),
      this.listPromotions(clientId),
    ]);

    return { client, sales, loyalty, sms, promotions };
  }

  listPromotions(clientId?: string) {
    return this.promotionsRepo.find({
      where: clientId
        ? [{ clientId }, { clientId: null as unknown as string }]
        : undefined,
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  createPromotion(payload: Partial<ClientPromotionEntity>) {
    if (!String(payload.title || '').trim()) {
      throw new BadRequestException('Укажите название акции');
    }
    const item = this.promotionsRepo.create({
      clientId: payload.clientId || undefined,
      title: String(payload.title || '').trim(),
      description: payload.description ? String(payload.description).trim() : undefined,
      discountPercent: Math.max(0, Number(payload.discountPercent || 0)),
      startsAt: payload.startsAt ? new Date(payload.startsAt) : null,
      endsAt: payload.endsAt ? new Date(payload.endsAt) : null,
      isActive: payload.isActive === undefined ? true : Boolean(payload.isActive),
    });
    return this.promotionsRepo.save(item);
  }

  async updatePromotion(id: string, payload: Partial<ClientPromotionEntity>) {
    const found = await this.promotionsRepo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Акция не найдена');
    await this.promotionsRepo.update(id, {
      clientId:
        payload.clientId === undefined ? found.clientId : payload.clientId || undefined,
      title: payload.title === undefined ? found.title : String(payload.title || '').trim(),
      description:
        payload.description === undefined
          ? found.description
          : payload.description
            ? String(payload.description).trim()
            : undefined,
      discountPercent:
        payload.discountPercent === undefined
          ? found.discountPercent
          : Math.max(0, Number(payload.discountPercent || 0)),
      startsAt:
        payload.startsAt === undefined
          ? found.startsAt
          : payload.startsAt
            ? new Date(payload.startsAt)
            : null,
      endsAt:
        payload.endsAt === undefined
          ? found.endsAt
          : payload.endsAt
            ? new Date(payload.endsAt)
            : null,
      isActive:
        payload.isActive === undefined ? found.isActive : Boolean(payload.isActive),
    });
    return this.promotionsRepo.findOneByOrFail({ id });
  }

  async removePromotion(id: string): Promise<{ success: true }> {
    await this.promotionsRepo.delete(id);
    return { success: true };
  }

}
