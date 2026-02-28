import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingKpiEntity } from '../database/entities/marketing-kpi.entity';
import { UserEntity } from '../database/entities/user.entity';

@Injectable()
export class MarketingKpiService {
  constructor(
    @InjectRepository(MarketingKpiEntity)
    private readonly kpiRepo: Repository<MarketingKpiEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  async findAll(params?: {
    month?: string;
    managerId?: string;
    q?: string;
    limit?: number;
    offset?: number;
  }) {
    const limit = Math.max(1, Math.min(300, Number(params?.limit ?? 100)));
    const offset = Math.max(0, Number(params?.offset ?? 0));

    const qb = this.kpiRepo
      .createQueryBuilder('k')
      .orderBy('k.month', 'DESC')
      .addOrderBy('k.updatedAt', 'DESC');

    if (params?.month?.trim()) qb.andWhere('k."month" = :month', { month: params.month.trim() });
    if (params?.managerId?.trim())
      qb.andWhere('k."managerId" = :managerId', { managerId: params.managerId.trim() });
    if (params?.q?.trim()) {
      const q = `%${params.q.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(k."managerName") LIKE :q OR LOWER(COALESCE(k."note", \'\')) LIKE :q)',
        { q },
      );
    }

    qb.take(limit).skip(offset);
    const [items, total] = await qb.getManyAndCount();
    return { items, total, limit, offset, hasMore: offset + items.length < total };
  }

  async create(payload: Partial<MarketingKpiEntity>) {
    const rawManagerId = String(payload.managerId || '').trim();
    const rawManagerName = String(payload.managerName || '').trim();
    const month = this.normalizeMonth(payload.month);
    const planMode = this.normalizePlanMode(payload.planMode);
    const isExternal = rawManagerId.startsWith('external:') || (!!rawManagerName && !rawManagerId);
    if (!rawManagerId && !rawManagerName) {
      throw new BadRequestException('Укажите исполнителя');
    }

    let managerId = rawManagerId;
    let managerName = rawManagerName;
    let managerRole = String(payload.managerRole || '').trim() || 'marketing';
    let branchName = String(payload.branchName || '').trim() || undefined;

    if (isExternal) {
      managerName = rawManagerName || rawManagerId.replace(/^external:/, '').replace(/_/g, ' ');
      if (!managerName) {
        throw new BadRequestException('Для внешнего исполнителя укажите имя');
      }
      managerId = rawManagerId || this.buildExternalManagerId(managerName);
    } else {
      const manager = await this.usersRepo.findOne({ where: { id: rawManagerId, deleted: false } });
      if (!manager) throw new BadRequestException('Сотрудник не найден');
      if (!this.isMarketingUser(manager)) {
        throw new BadRequestException(
          'KPI доступен только для ролей SMM/Marketing. Для остальных используйте внешнего исполнителя.',
        );
      }
      managerId = manager.id;
      managerName = manager.name;
      managerRole = manager.role;
      branchName = manager.branchName;
    }

    const period = this.normalizePeriod(planMode, payload.periodStart, payload.periodEnd);
    const planItems = this.normalizePlanItems(payload.planItems);

    if (planMode === 'month') {
      const existing = await this.kpiRepo.findOne({ where: { managerId, month, planMode } });
      if (existing) {
        throw new BadRequestException('Запись KPI за этот месяц уже существует');
      }
    } else {
      const periodStart = period.periodStart as Date;
      const periodEnd = period.periodEnd as Date;
      const existing = await this.kpiRepo.findOne({
        where: {
          managerId,
          month,
          planMode,
          periodStart,
          periodEnd,
        },
      });
      if (existing) {
        throw new BadRequestException('Запись KPI за эту неделю уже существует');
      }
    }

    const computed = this.computeKpi({
      ...payload,
      planMode,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      planItems,
    });
    const entity = this.kpiRepo.create({
      managerId,
      managerName,
      managerRole,
      branchName,
      month,
      planMode,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      planItems,
      ...computed,
      note: String(payload.note || '').trim() || undefined,
    });
    return this.kpiRepo.save(entity);
  }

  async update(id: string, payload: Partial<MarketingKpiEntity>) {
    const item = await this.kpiRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('KPI запись не найдена');

    if (payload.month !== undefined) item.month = this.normalizeMonth(payload.month);
    if (payload.note !== undefined) item.note = String(payload.note || '').trim() || undefined;
    if (payload.planMode !== undefined) item.planMode = this.normalizePlanMode(payload.planMode);
    if (payload.periodStart !== undefined || payload.periodEnd !== undefined || payload.planMode) {
      const period = this.normalizePeriod(
        item.planMode,
        payload.periodStart ?? item.periodStart,
        payload.periodEnd ?? item.periodEnd,
      );
      item.periodStart = period.periodStart;
      item.periodEnd = period.periodEnd;
    }
    if (payload.planItems !== undefined) item.planItems = this.normalizePlanItems(payload.planItems);

    const computed = this.computeKpi({ ...item, ...payload });
    Object.assign(item, computed);
    return this.kpiRepo.save(item);
  }

  private normalizeMonth(raw?: string | null) {
    const value = String(raw || '').trim();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
      throw new BadRequestException('month должен быть в формате YYYY-MM');
    }
    return value;
  }

  private normalizePlanMode(raw?: string | null): 'week' | 'month' {
    const mode = String(raw || 'month').trim().toLowerCase();
    return mode === 'week' ? 'week' : 'month';
  }

  private isMarketingUser(user: UserEntity) {
    const tokens = new Set<string>([
      String((user as { role?: string }).role || '')
        .trim()
        .toLowerCase(),
      ...((user.roles || []) as string[]).map((r) =>
        String(r || '')
          .trim()
          .toLowerCase(),
      ),
    ]);
    return tokens.has('smm') || tokens.has('marketing');
  }

  private buildExternalManagerId(name: string) {
    const normalized = String(name)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_а-яё-]/gi, '');
    return `external:${normalized || Date.now()}`;
  }

  private normalizePeriod(mode: 'week' | 'month', startRaw?: unknown, endRaw?: unknown) {
    if (mode === 'month') {
      return { periodStart: null, periodEnd: null };
    }
    const start = this.normalizeDate(startRaw);
    const end = this.normalizeDate(endRaw);
    if (!start || !end) {
      throw new BadRequestException('Для недельного плана укажите periodStart и periodEnd');
    }
    if (start.getTime() > end.getTime()) {
      throw new BadRequestException('periodStart не может быть позже periodEnd');
    }
    return { periodStart: start, periodEnd: end };
  }

  private normalizeDate(raw?: unknown) {
    if (raw === null || raw === undefined || raw === '') return null;
    const value = raw instanceof Date ? raw : new Date(String(raw));
    if (!Number.isFinite(value.getTime())) return null;
    return value;
  }

  private normalizePlanItems(raw?: unknown): MarketingKpiEntity['planItems'] {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item, index) => {
        const src = (item || {}) as Record<string, unknown>;
        const dateRaw = String(src.date || '').trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) return null;
        const typeRaw = String(src.type || 'other').trim().toLowerCase();
        const type = ['post', 'reels', 'story', 'other'].includes(typeRaw)
          ? (typeRaw as 'post' | 'reels' | 'story' | 'other')
          : 'other';
        const id = String(src.id || '').trim() || `item-${index + 1}-${dateRaw}`;
        const title = String(src.title || '').trim();
        return {
          id,
          date: dateRaw,
          type,
          title: title || undefined,
          done: Boolean(src.done),
        };
      })
      .filter(Boolean) as NonNullable<MarketingKpiEntity['planItems']>;
  }

  private toNum(value: unknown, min = 0) {
    const n = Number(value ?? 0);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, n);
  }

  private computeKpi(payload: Partial<MarketingKpiEntity>) {
    const plannedPosts = this.toNum(payload.plannedPosts);
    const plannedReels = this.toNum(payload.plannedReels);
    const publishedPosts = this.toNum(payload.publishedPosts);
    const publishedReels = this.toNum(payload.publishedReels);
    const reach = this.toNum(payload.reach);
    const engagements = this.toNum(payload.engagements);
    const followersGrowth = this.toNum(payload.followersGrowth);
    const salaryBase = this.toNum(payload.salaryBase);
    const planItems = Array.isArray(payload.planItems) ? payload.planItems : [];

    const totalPlanned = plannedPosts + plannedReels;
    const totalPublished = publishedPosts + publishedReels;
    const planRateByVolume = totalPlanned > 0 ? totalPublished / totalPlanned : 0;
    const plannedChecklist = planItems.length;
    const doneChecklist = planItems.filter((x) => x?.done).length;
    const planRateByChecklist = plannedChecklist > 0 ? doneChecklist / plannedChecklist : 0;
    const planRate =
      plannedChecklist > 0 && totalPlanned > 0
        ? planRateByChecklist * 0.6 + planRateByVolume * 0.4
        : plannedChecklist > 0
          ? planRateByChecklist
          : planRateByVolume;
    const erPercent = reach > 0 ? (engagements / reach) * 100 : 0;

    const planScore = Math.min(130, planRate * 100);
    const erScore = Math.min(130, (erPercent / 10) * 100);
    const growthScore = Math.min(130, (followersGrowth / 1000) * 100);
    const kpiScore = planScore * 0.5 + erScore * 0.3 + growthScore * 0.2;

    let adjustRate = 0;
    if (kpiScore >= 110) adjustRate = 0.2;
    else if (kpiScore >= 95) adjustRate = 0.1;
    else if (kpiScore >= 80) adjustRate = 0.03;
    else if (kpiScore < 60) adjustRate = -0.2;
    else if (kpiScore < 70) adjustRate = -0.1;
    else if (kpiScore < 80) adjustRate = -0.05;

    const salaryBonus = salaryBase * adjustRate;
    const salaryTotal = salaryBase + salaryBonus;

    return {
      plannedPosts,
      plannedReels,
      publishedPosts,
      publishedReels,
      reach,
      engagements,
      followersGrowth,
      erPercent: Number(erPercent.toFixed(2)),
      kpiScore: Number(kpiScore.toFixed(2)),
      salaryBase,
      salaryBonus: Number(salaryBonus.toFixed(2)),
      salaryTotal: Number(salaryTotal.toFixed(2)),
    };
  }
}
