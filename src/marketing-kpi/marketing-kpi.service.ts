import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

    if (params?.month?.trim())
      qb.andWhere('k."month" = :month', { month: params.month.trim() });
    if (params?.managerId?.trim())
      qb.andWhere('k."managerId" = :managerId', {
        managerId: params.managerId.trim(),
      });
    if (params?.q?.trim()) {
      const q = `%${params.q.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(k."managerName") LIKE :q OR LOWER(COALESCE(k."note", \'\')) LIKE :q)',
        { q },
      );
    }

    qb.take(limit).skip(offset);
    const [items, total] = await qb.getManyAndCount();
    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  async create(payload: Partial<MarketingKpiEntity>) {
    const rawManagerId = String(payload.managerId || '').trim();
    const rawManagerName = String(payload.managerName || '').trim();
    const month = this.normalizeMonth(payload.month);
    const planMode = this.normalizePlanMode(payload.planMode);
    const isExternal =
      rawManagerId.startsWith('external:') ||
      (!!rawManagerName && !rawManagerId);
    if (!rawManagerId && !rawManagerName) {
      throw new BadRequestException('Укажите исполнителя');
    }

    let managerId = rawManagerId;
    let managerName = rawManagerName;
    let managerRole = String(payload.managerRole || '').trim() || 'marketing';
    let branchName = String(payload.branchName || '').trim() || undefined;

    if (isExternal) {
      managerName =
        rawManagerName ||
        rawManagerId.replace(/^external:/, '').replace(/_/g, ' ');
      if (!managerName) {
        throw new BadRequestException('Для внешнего исполнителя укажите имя');
      }
      managerId = rawManagerId || this.buildExternalManagerId(managerName);
    } else {
      const manager = await this.usersRepo.findOne({
        where: { id: rawManagerId, deleted: false },
      });
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

    const period = this.normalizePeriod(
      planMode,
      payload.periodStart,
      payload.periodEnd,
    );
    const planItems = this.normalizePlanItems(payload.planItems);

    if (planMode === 'month') {
      const existing = await this.kpiRepo.findOne({
        where: { managerId, month, planMode },
      });
      if (existing) {
        throw new BadRequestException(
          'Запись KPI за этот месяц уже существует',
        );
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
        throw new BadRequestException(
          'Запись KPI за эту неделю уже существует',
        );
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

    if (payload.month !== undefined)
      item.month = this.normalizeMonth(payload.month);
    if (payload.note !== undefined)
      item.note = String(payload.note || '').trim() || undefined;
    if (payload.planMode !== undefined)
      item.planMode = this.normalizePlanMode(payload.planMode);
    if (
      payload.periodStart !== undefined ||
      payload.periodEnd !== undefined ||
      payload.planMode
    ) {
      const period = this.normalizePeriod(
        item.planMode,
        payload.periodStart ?? item.periodStart,
        payload.periodEnd ?? item.periodEnd,
      );
      item.periodStart = period.periodStart;
      item.periodEnd = period.periodEnd;
    }
    if (payload.planItems !== undefined)
      item.planItems = this.normalizePlanItems(payload.planItems);

    const computed = this.computeKpi({ ...item, ...payload });
    Object.assign(item, computed);
    return this.kpiRepo.save(item);
  }

  async getInsights(params?: {
    month?: string;
    managerId?: string;
    q?: string;
  }) {
    const month = this.normalizeMonth(params?.month);
    const prevMonth = this.getPrevMonth(month);
    const currentRows = await this.findRowsForInsights({
      month,
      managerId: params?.managerId,
      q: params?.q,
    });
    const previousRows = await this.findRowsForInsights({
      month: prevMonth,
      managerId: params?.managerId,
      q: params?.q,
    });

    const currentTotals = this.buildTotals(currentRows);
    const previousTotals = this.buildTotals(previousRows);
    const healthScore = this.buildHealthScore(currentTotals);

    const performerControl = currentRows
      .map((row) => this.buildPerformerControlRow(row))
      .sort((a, b) => {
        const statusWeight = (status: 'risk' | 'stable' | 'strong') =>
          status === 'risk' ? 0 : status === 'stable' ? 1 : 2;
        const sw = statusWeight(a.status) - statusWeight(b.status);
        if (sw !== 0) return sw;
        return a.kpiScore - b.kpiScore;
      });

    const alerts = this.buildAlerts({
      month,
      totals: currentTotals,
      healthScore,
      performerControl,
    });

    const trend = {
      kpiDelta: Number(
        (currentTotals.avgKpi - previousTotals.avgKpi).toFixed(2),
      ),
      erDelta: Number((currentTotals.avgEr - previousTotals.avgEr).toFixed(2)),
      planCompletionDelta: Number(
        (currentTotals.planCompletion - previousTotals.planCompletion).toFixed(
          4,
        ),
      ),
      salaryDeltaPercent:
        previousTotals.totalSalary > 0
          ? Number(
              (
                ((currentTotals.totalSalary - previousTotals.totalSalary) /
                  previousTotals.totalSalary) *
                100
              ).toFixed(2),
            )
          : currentTotals.totalSalary > 0
            ? 100
            : 0,
    };

    return {
      month,
      prevMonth,
      healthScore,
      totals: currentTotals,
      trend,
      alerts,
      performerControl,
    };
  }

  private async findRowsForInsights(params: {
    month: string;
    managerId?: string;
    q?: string;
  }) {
    const qb = this.kpiRepo
      .createQueryBuilder('k')
      .where('k."month" = :month', { month: params.month });

    if (params.managerId?.trim()) {
      qb.andWhere('k."managerId" = :managerId', {
        managerId: params.managerId.trim(),
      });
    }
    if (params.q?.trim()) {
      const q = `%${params.q.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(k."managerName") LIKE :q OR LOWER(COALESCE(k."note", \'\')) LIKE :q)',
        { q },
      );
    }

    return qb.getMany();
  }

  private buildTotals(rows: MarketingKpiEntity[]) {
    const total = rows.length;
    if (total === 0) {
      return {
        records: 0,
        avgKpi: 0,
        avgEr: 0,
        planCompletion: 0,
        checklistCompletion: 0,
        totalSalary: 0,
        riskCount: 0,
        strongCount: 0,
      };
    }

    const sum = rows.reduce(
      (acc, row) => {
        const volume = this.computeVolumeCompletion(row);
        const checklist = this.computeChecklistCompletion(row);
        acc.kpi += Number(row.kpiScore || 0);
        acc.er += Number(row.erPercent || 0);
        acc.salary += Number(row.salaryTotal || 0);
        acc.volume += volume;
        acc.checklist += checklist;
        if (Number(row.kpiScore || 0) < 70) acc.risk += 1;
        if (Number(row.kpiScore || 0) >= 95) acc.strong += 1;
        return acc;
      },
      {
        kpi: 0,
        er: 0,
        salary: 0,
        volume: 0,
        checklist: 0,
        risk: 0,
        strong: 0,
      },
    );

    return {
      records: total,
      avgKpi: Number((sum.kpi / total).toFixed(2)),
      avgEr: Number((sum.er / total).toFixed(2)),
      planCompletion: Number((sum.volume / total).toFixed(4)),
      checklistCompletion: Number((sum.checklist / total).toFixed(4)),
      totalSalary: Number(sum.salary.toFixed(2)),
      riskCount: sum.risk,
      strongCount: sum.strong,
    };
  }

  private computeVolumeCompletion(row: Partial<MarketingKpiEntity>) {
    const planned = this.toNum(row.plannedPosts) + this.toNum(row.plannedReels);
    const published =
      this.toNum(row.publishedPosts) + this.toNum(row.publishedReels);
    if (planned <= 0) return 0;
    return Math.max(0, Math.min(1.5, published / planned));
  }

  private computeChecklistCompletion(row: Partial<MarketingKpiEntity>) {
    const items = Array.isArray(row.planItems) ? row.planItems : [];
    if (items.length === 0) return 0;
    const done = items.filter((x) => x?.done).length;
    return Math.max(0, Math.min(1, done / items.length));
  }

  private buildHealthScore(totals: {
    avgKpi: number;
    avgEr: number;
    planCompletion: number;
    checklistCompletion: number;
    riskCount: number;
    records: number;
  }) {
    if (totals.records === 0) return 0;
    const kpiPart = Math.max(0, Math.min(100, totals.avgKpi)) * 0.5;
    const planPart =
      Math.max(0, Math.min(100, totals.planCompletion * 100)) * 0.25;
    const checklistPart =
      Math.max(0, Math.min(100, totals.checklistCompletion * 100)) * 0.15;
    const erPart = Math.max(0, Math.min(100, (totals.avgEr / 8) * 100)) * 0.1;
    const riskPenalty =
      totals.records > 0 ? (totals.riskCount / totals.records) * 20 : 0;
    return Number(
      Math.max(
        0,
        Math.min(
          100,
          kpiPart + planPart + checklistPart + erPart - riskPenalty,
        ),
      ).toFixed(2),
    );
  }

  private buildPerformerControlRow(row: MarketingKpiEntity) {
    const kpiScore = Number(row.kpiScore || 0);
    const erPercent = Number(row.erPercent || 0);
    const planCompletion = this.computeVolumeCompletion(row);
    const checklistCompletion = this.computeChecklistCompletion(row);

    let status: 'risk' | 'stable' | 'strong' = 'stable';
    if (kpiScore < 70 || planCompletion < 0.75) status = 'risk';
    else if (kpiScore >= 95 && planCompletion >= 0.95) status = 'strong';

    let nextAction = 'Поддерживать ритм публикаций и качество контента.';
    if (status === 'risk') {
      nextAction =
        'Запустить корректирующий план на 7 дней: ежедневный контент-слот + контроль дедлайнов.';
    } else if (status === 'strong') {
      nextAction =
        'Тиражировать лучшие форматы в команде и закрепить как стандарт контент-плана.';
    }

    return {
      managerId: row.managerId,
      managerName: row.managerName,
      managerRole: row.managerRole,
      kpiScore: Number(kpiScore.toFixed(2)),
      erPercent: Number(erPercent.toFixed(2)),
      planCompletion: Number(planCompletion.toFixed(4)),
      checklistCompletion: Number(checklistCompletion.toFixed(4)),
      salaryTotal: Number(Number(row.salaryTotal || 0).toFixed(2)),
      status,
      nextAction,
    };
  }

  private buildAlerts(params: {
    month: string;
    totals: {
      records: number;
      avgKpi: number;
      avgEr: number;
      planCompletion: number;
      checklistCompletion: number;
      riskCount: number;
    };
    healthScore: number;
    performerControl: Array<{
      managerId: string;
      managerName: string;
      status: 'risk' | 'stable' | 'strong';
      kpiScore: number;
      planCompletion: number;
    }>;
  }) {
    const alerts: Array<{
      id: string;
      level: 'critical' | 'warning' | 'success' | 'info';
      title: string;
      description: string;
      managerId?: string;
      managerName?: string;
    }> = [];

    if (params.totals.records === 0) {
      return [
        {
          id: `empty-${params.month}`,
          level: 'info' as const,
          title: 'Нет KPI-данных за период',
          description:
            'Добавьте KPI-записи по SMM/маркетингу, чтобы включился автоматический контроль и прогноз.',
        },
      ];
    }

    if (params.healthScore < 65) {
      alerts.push({
        id: `health-critical-${params.month}`,
        level: 'critical',
        title: 'Низкий health score маркетинга',
        description:
          'Текущий период в зоне риска. Нужен антикризисный недельный план и ежедневный контроль чеклиста.',
      });
    } else if (params.healthScore >= 90) {
      alerts.push({
        id: `health-strong-${params.month}`,
        level: 'success',
        title: 'Сильная динамика маркетинга',
        description:
          'Команда стабильно выполняет KPI. Зафиксируйте рабочие гипотезы и масштабируйте их.',
      });
    }

    if (params.totals.planCompletion < 0.8) {
      alerts.push({
        id: `plan-gap-${params.month}`,
        level: 'warning',
        title: 'Недовыполнение контент-плана',
        description: `План закрыт только на ${(
          params.totals.planCompletion * 100
        ).toFixed(1)}%. Пересоберите недельный план с приоритетом публикаций.`,
      });
    }

    if (params.totals.avgEr < 3) {
      alerts.push({
        id: `er-low-${params.month}`,
        level: 'warning',
        title: 'Низкий ER по периоду',
        description:
          'Средний ER ниже 3%. Усильте CTA, тестируйте Reels-хуки и форматы с высоким удержанием.',
      });
    }

    params.performerControl
      .filter((x) => x.status === 'risk')
      .slice(0, 5)
      .forEach((row) => {
        alerts.push({
          id: `risk-${row.managerId}`,
          level: row.kpiScore < 60 ? 'critical' : 'warning',
          title: `Риск по исполнителю: ${row.managerName}`,
          description: `KPI ${row.kpiScore.toFixed(1)}, план ${(
            row.planCompletion * 100
          ).toFixed(1)}%`,
          managerId: row.managerId,
          managerName: row.managerName,
        });
      });

    return alerts.slice(0, 12);
  }

  private getPrevMonth(month: string) {
    const [y, m] = month.split('-').map((x) => Number(x));
    const date = new Date(Date.UTC(y, m - 1, 1));
    date.setUTCMonth(date.getUTCMonth() - 1);
    const yy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${yy}-${mm}`;
  }

  private normalizeMonth(raw?: string | null) {
    const value = String(raw || '').trim();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
      throw new BadRequestException('month должен быть в формате YYYY-MM');
    }
    return value;
  }

  private normalizePlanMode(raw?: string | null): 'week' | 'month' {
    const mode = String(raw || 'month')
      .trim()
      .toLowerCase();
    return mode === 'week' ? 'week' : 'month';
  }

  private isMarketingUser(user: UserEntity) {
    const tokens = new Set<string>([
      String((user as { role?: string }).role || '')
        .trim()
        .toLowerCase(),
      ...(user.roles || []).map((r) =>
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

  private isKpiAccrualEligibleRole(role?: string | null) {
    const normalized = String(role || '')
      .trim()
      .toLowerCase();
    if (!normalized) return false;
    return (
      normalized !== 'manager' &&
      normalized !== 'cashier' &&
      normalized !== 'storekeeper'
    );
  }

  private normalizePeriod(
    mode: 'week' | 'month',
    startRaw?: unknown,
    endRaw?: unknown,
  ) {
    if (mode === 'month') {
      return { periodStart: null, periodEnd: null };
    }
    const start = this.normalizeDate(startRaw);
    const end = this.normalizeDate(endRaw);
    if (!start || !end) {
      throw new BadRequestException(
        'Для недельного плана укажите periodStart и periodEnd',
      );
    }
    if (start.getTime() > end.getTime()) {
      throw new BadRequestException(
        'periodStart не может быть позже periodEnd',
      );
    }
    return { periodStart: start, periodEnd: end };
  }

  private normalizeDate(raw?: unknown) {
    if (raw === null || raw === undefined || raw === '') return null;
    const rawText =
      typeof raw === 'string' || typeof raw === 'number' ? String(raw) : '';
    const value = raw instanceof Date ? raw : new Date(rawText);
    if (!Number.isFinite(value.getTime())) return null;
    return value;
  }

  private normalizePlanItems(raw?: unknown): MarketingKpiEntity['planItems'] {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item, index) => {
        const src = (item || {}) as Record<string, unknown>;
        const dateRaw = this.toSafeString(src.date).trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) return null;
        const typeRaw = this.toSafeString(src.type || 'other')
          .trim()
          .toLowerCase();
        const type = ['post', 'reels', 'story', 'other'].includes(typeRaw)
          ? (typeRaw as 'post' | 'reels' | 'story' | 'other')
          : 'other';
        const id =
          this.toSafeString(src.id).trim() || `item-${index + 1}-${dateRaw}`;
        const title = this.toSafeString(src.title).trim();
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

  private toSafeString(value: unknown) {
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }
    return '';
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
    const planRateByVolume =
      totalPlanned > 0 ? totalPublished / totalPlanned : 0;
    const plannedChecklist = planItems.length;
    const doneChecklist = planItems.filter((x) => x?.done).length;
    const planRateByChecklist =
      plannedChecklist > 0 ? doneChecklist / plannedChecklist : 0;
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

    const canAccrueSalary = this.isKpiAccrualEligibleRole(payload.managerRole);
    const effectiveSalaryBase = canAccrueSalary ? salaryBase : 0;
    const salaryBonus = effectiveSalaryBase * adjustRate;
    const salaryTotal = effectiveSalaryBase + salaryBonus;

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
      salaryBase: effectiveSalaryBase,
      salaryBonus: Number(salaryBonus.toFixed(2)),
      salaryTotal: Number(salaryTotal.toFixed(2)),
    };
  }
}
