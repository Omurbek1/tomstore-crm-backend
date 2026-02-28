import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RepairStatus,
  RepairTicketEntity,
} from '../database/entities/repair-ticket.entity';
import { RepairEventEntity } from '../database/entities/repair-event.entity';

@Injectable()
export class RepairsService {
  constructor(
    @InjectRepository(RepairTicketEntity)
    private readonly ticketsRepo: Repository<RepairTicketEntity>,
    @InjectRepository(RepairEventEntity)
    private readonly eventsRepo: Repository<RepairEventEntity>,
  ) {}

  async findAll(params?: { q?: string; limit?: number; offset?: number }) {
    const limit = Math.max(1, Math.min(200, Number(params?.limit ?? 50)));
    const offset = Math.max(0, Number(params?.offset ?? 0));

    const qb = this.ticketsRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.messages', 'm')
      .orderBy('t.updatedAt', 'DESC')
      .addOrderBy('m.createdAt', 'ASC');

    if (params?.q?.trim()) {
      const q = `%${params.q.trim().toLowerCase()}%`;
      qb.andWhere(
        `(
          LOWER(t."clientName") LIKE :q
          OR LOWER(t."itemName") LIKE :q
          OR LOWER(COALESCE(t."clientPhone", '')) LIKE :q
          OR LOWER(COALESCE(t."serialNumber", '')) LIKE :q
          OR LOWER(COALESCE(t."issue", '')) LIKE :q
        )`,
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

  async create(payload: {
    clientName?: string;
    clientPhone?: string;
    itemName?: string;
    serialNumber?: string;
    issue?: string;
    branchName?: string;
    author?: string;
    initialMessage?: string;
  }) {
    const clientName = String(payload.clientName || '').trim();
    const itemName = String(payload.itemName || '').trim();
    const issue = String(payload.issue || '').trim();

    if (!clientName || !itemName || !issue) {
      throw new BadRequestException(
        'clientName, itemName и issue обязательны',
      );
    }

    const ticket = await this.ticketsRepo.save(
      this.ticketsRepo.create({
        clientName,
        clientPhone: payload.clientPhone?.trim() || undefined,
        itemName,
        serialNumber: payload.serialNumber?.trim() || undefined,
        issue,
        branchName: payload.branchName?.trim() || undefined,
        status: 'received',
      }),
    );

    await this.eventsRepo.save(
      this.eventsRepo.create({
        ticketId: ticket.id,
        text:
          String(payload.initialMessage || '').trim() ||
          'Заявка создана. Товар принят от клиента.',
        author: String(payload.author || '').trim() || 'Система',
        status: 'received',
      }),
    );

    return this.findOne(ticket.id);
  }

  async findOne(id: string) {
    const ticket = await this.ticketsRepo.findOne({
      where: { id },
      relations: { messages: true },
      order: { messages: { createdAt: 'ASC' } },
    });
    if (!ticket) throw new NotFoundException('Заявка не найдена');
    return ticket;
  }

  async addEvent(
    id: string,
    payload: { text?: string; author?: string; status?: RepairStatus },
  ) {
    const ticket = await this.ticketsRepo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Заявка не найдена');

    const text = String(payload.text || '').trim();
    if (!text) throw new BadRequestException('text обязателен');

    const author = String(payload.author || '').trim() || 'Система';

    await this.eventsRepo.save(
      this.eventsRepo.create({
        ticketId: ticket.id,
        text,
        author,
        status: payload.status,
      }),
    );

    if (payload.status) {
      ticket.status = payload.status;
    }
    await this.ticketsRepo.save(ticket);

    return this.findOne(ticket.id);
  }

  async updateStatus(
    id: string,
    payload: { status?: RepairStatus; author?: string; text?: string },
  ) {
    const ticket = await this.ticketsRepo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Заявка не найдена');

    const status = payload.status;
    if (!status) throw new BadRequestException('status обязателен');

    ticket.status = status;
    await this.ticketsRepo.save(ticket);

    const text = String(payload.text || '').trim();
    await this.eventsRepo.save(
      this.eventsRepo.create({
        ticketId: ticket.id,
        status,
        author: String(payload.author || '').trim() || 'Система',
        text: text || `Статус изменен: ${status}`,
      }),
    );

    return this.findOne(ticket.id);
  }
}
