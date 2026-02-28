import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashShiftEntity } from '../database/entities/cash-shift.entity';
import { SaleEntity } from '../database/entities/sale.entity';

@Injectable()
export class CashShiftsService {
  constructor(
    @InjectRepository(CashShiftEntity)
    private readonly shiftsRepo: Repository<CashShiftEntity>,
    @InjectRepository(SaleEntity)
    private readonly salesRepo: Repository<SaleEntity>,
  ) {}

  findAll(params?: { cashierId?: string; limit?: number; offset?: number }) {
    const take = Math.max(1, Math.min(200, Number(params?.limit ?? 50)));
    const skip = Math.max(0, Number(params?.offset ?? 0));

    return this.shiftsRepo.find({
      where: params?.cashierId ? { cashierId: params.cashierId } : undefined,
      order: { openedAt: 'DESC' },
      take,
      skip,
    });
  }

  private async getOutstandingDebt(cashierId: string) {
    const shifts = await this.shiftsRepo.find({
      where: { cashierId, status: 'closed' },
      order: { openedAt: 'ASC' },
    });

    return shifts.reduce((debt, shift) => {
      const shortage = Math.max(0, Number(shift.shortageAmount ?? 0));
      const overage = Math.max(0, Number(shift.overageAmount ?? 0));
      return Math.max(0, debt + shortage - overage);
    }, 0);
  }

  async getCurrent(cashierId: string) {
    if (!cashierId?.trim()) {
      throw new BadRequestException('cashierId обязателен');
    }
    const shift = await this.shiftsRepo.findOne({
      where: { cashierId: cashierId.trim(), status: 'open' },
      order: { openedAt: 'DESC' },
    });
    if (!shift) return null;
    if (shift.debtBefore === null || shift.debtBefore === undefined) {
      const debt = await this.getOutstandingDebt(cashierId.trim());
      shift.debtBefore = debt;
      shift.debtAfter = debt;
      await this.shiftsRepo.save(shift);
    }
    return shift;
  }

  async openShift(payload: {
    cashierId?: string;
    cashierName?: string;
    branchName?: string;
    openingCash?: number;
    noteOpen?: string;
  }) {
    const cashierId = String(payload.cashierId || '').trim();
    const cashierName = String(payload.cashierName || '').trim();
    if (!cashierId || !cashierName) {
      throw new BadRequestException('cashierId и cashierName обязательны');
    }

    const current = await this.getCurrent(cashierId);
    if (current) {
      throw new BadRequestException('У кассира уже есть открытая смена');
    }

    const openingCash = Number(payload.openingCash ?? 0);
    if (!Number.isFinite(openingCash) || openingCash < 0) {
      throw new BadRequestException('Старт кассы должен быть >= 0');
    }
    const debtBefore = await this.getOutstandingDebt(cashierId);

    const shift = this.shiftsRepo.create({
      cashierId,
      cashierName,
      branchName: payload.branchName?.trim() || undefined,
      status: 'open',
      openedAt: new Date(),
      openingCash,
      debtBefore,
      debtAfter: debtBefore,
      shortageAmount: 0,
      overageAmount: 0,
      noteOpen: payload.noteOpen,
    });

    return this.shiftsRepo.save(shift);
  }

  async closeShift(
    id: string,
    payload: {
      closingCash?: number;
      noteClose?: string;
    },
  ) {
    const shift = await this.shiftsRepo.findOne({ where: { id } });
    if (!shift) throw new NotFoundException('Смена не найдена');
    if (shift.status !== 'open') {
      throw new BadRequestException('Смена уже закрыта');
    }

    const report = await this.getReport(id);
    const closingCash = Number(payload.closingCash ?? 0);
    if (!Number.isFinite(closingCash) || closingCash < 0) {
      throw new BadRequestException('Факт кассы должен быть >= 0');
    }
    const expectedCash = Number(report.expectedCash || 0);
    const difference = closingCash - expectedCash;
    const shortageAmount = Math.max(0, expectedCash - closingCash);
    const overageAmount = Math.max(0, closingCash - expectedCash);
    const debtBefore = Math.max(0, Number(shift.debtBefore ?? 0));
    const debtAfter = Math.max(0, debtBefore + shortageAmount - overageAmount);

    shift.status = 'closed';
    shift.closedAt = new Date();
    shift.closingCash = closingCash;
    shift.expectedCash = expectedCash;
    shift.difference = difference;
    shift.shortageAmount = shortageAmount;
    shift.overageAmount = overageAmount;
    shift.debtAfter = debtAfter;
    shift.noteClose = payload.noteClose;

    await this.shiftsRepo.save(shift);
    return this.findOne(id);
  }

  async findOne(id: string) {
    const shift = await this.shiftsRepo.findOne({ where: { id } });
    if (!shift) throw new NotFoundException('Смена не найдена');
    return shift;
  }

  async getReport(id: string) {
    const shift = await this.findOne(id);

    const sales = await this.salesRepo.find({
      where: { shiftId: id },
      order: { createdAt: 'ASC' },
    });

    const totalOrders = sales.length;
    const totalRevenue = sales.reduce((s, x) => s + Number(x.total || 0), 0);

    const cashRevenue = sales
      .filter((x) => x.paymentType === 'cash')
      .reduce((s, x) => s + Number(x.total || 0), 0);

    const manualRevenue = sales
      .filter((x) => x.paymentType === 'manual')
      .reduce((s, x) => s + Number(x.total || 0), 0);

    const installmentRevenue = sales
      .filter((x) => x.paymentType === 'installment')
      .reduce((s, x) => s + Number(x.total || 0), 0);

    const hybridRevenue = sales
      .filter((x) => x.paymentType === 'hybrid')
      .reduce((s, x) => s + Number(x.total || 0), 0);

    const bookingRevenue = sales
      .filter((x) => x.paymentType === 'booking')
      .reduce((s, x) => s + Number(x.total || 0), 0);

    const expectedCash = Number(shift.openingCash || 0) + cashRevenue;
    const closingCash = Number(shift.closingCash || 0);
    const isClosed = shift.status === 'closed';

    return {
      shift,
      totals: {
        totalOrders,
        totalRevenue,
        cashRevenue,
        manualRevenue,
        installmentRevenue,
        hybridRevenue,
        bookingRevenue,
      },
      expectedCash,
      shortageAmount: isClosed ? Math.max(0, expectedCash - closingCash) : 0,
      overageAmount: isClosed ? Math.max(0, closingCash - expectedCash) : 0,
      debtBefore: Number(shift.debtBefore || 0),
      debtAfter: Number(shift.debtAfter || shift.debtBefore || 0),
      sales,
    };
  }
}
