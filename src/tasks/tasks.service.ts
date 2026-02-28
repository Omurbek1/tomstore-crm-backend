import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TaskEntity,
  TaskPriority,
  TaskStatus,
} from '../database/entities/task.entity';
import { UserEntity } from '../database/entities/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly tasksRepo: Repository<TaskEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  async findAll(params?: {
    q?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    limit?: number;
    offset?: number;
  }) {
    const limit = Math.max(1, Math.min(300, Number(params?.limit ?? 100)));
    const offset = Math.max(0, Number(params?.offset ?? 0));

    const qb = this.tasksRepo
      .createQueryBuilder('t')
      .orderBy('t.updatedAt', 'DESC')
      .addOrderBy('t.createdAt', 'DESC');

    if (params?.q?.trim()) {
      const q = `%${params.q.trim().toLowerCase()}%`;
      qb.andWhere(
        `(LOWER(t."title") LIKE :q OR LOWER(COALESCE(t."description", '')) LIKE :q OR LOWER(COALESCE(t."assigneeName", '')) LIKE :q)`,
        { q },
      );
    }

    if (params?.status) qb.andWhere('t."status" = :status', { status: params.status });
    if (params?.priority)
      qb.andWhere('t."priority" = :priority', { priority: params.priority });
    if (params?.assigneeId?.trim())
      qb.andWhere('t."assigneeId" = :assigneeId', {
        assigneeId: params.assigneeId.trim(),
      });

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
    title?: string;
    description?: string;
    assigneeId?: string;
    assigneeName?: string;
    assigneeRole?: string;
    deadline?: string;
    priority?: TaskPriority;
    createdById?: string;
    createdByName?: string;
  }) {
    const title = String(payload.title || '').trim();
    if (!title) throw new BadRequestException('title обязателен');

    const assigneeId = payload.assigneeId?.trim();
    const customAssigneeName = String(payload.assigneeName || '').trim();
    const customAssigneeRole = String(payload.assigneeRole || '').trim();

    let assignee: UserEntity | null = null;
    if (assigneeId) {
      assignee = await this.usersRepo.findOne({
        where: { id: assigneeId, deleted: false },
      });
      if (!assignee) throw new BadRequestException('Исполнитель не найден');
    } else if (!customAssigneeName) {
      throw new BadRequestException(
        'Укажите исполнителя: сотрудник или произвольное имя',
      );
    }

    const task = this.tasksRepo.create({
      title,
      description: payload.description?.trim() || undefined,
      assigneeId: assignee?.id,
      assigneeName: assignee?.name || customAssigneeName,
      assigneeRole: assignee?.role || customAssigneeRole || undefined,
      deadline: payload.deadline ? new Date(payload.deadline) : null,
      priority: this.normalizePriority(payload.priority),
      status: 'todo',
      createdById: payload.createdById?.trim() || undefined,
      createdByName: payload.createdByName?.trim() || undefined,
      completedAt: null,
    });

    return this.tasksRepo.save(task);
  }

  async update(
    id: string,
    payload: {
      title?: string;
      description?: string;
      assigneeId?: string;
      assigneeName?: string;
      assigneeRole?: string;
      deadline?: string | null;
      priority?: TaskPriority;
      status?: TaskStatus;
    },
  ) {
    const task = await this.tasksRepo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Задача не найдена');

    if (payload.title !== undefined) {
      const title = String(payload.title || '').trim();
      if (!title) throw new BadRequestException('title обязателен');
      task.title = title;
    }
    if (payload.description !== undefined) {
      task.description = String(payload.description || '').trim() || undefined;
    }
    if (payload.assigneeId !== undefined) {
      const assigneeId = String(payload.assigneeId || '').trim();
      if (!assigneeId) {
        task.assigneeId = undefined;
      } else {
        const assignee = await this.usersRepo.findOne({
          where: { id: assigneeId, deleted: false },
        });
        if (!assignee) throw new BadRequestException('Исполнитель не найден');
        task.assigneeId = assignee.id;
        task.assigneeName = assignee.name;
        task.assigneeRole = assignee.role;
      }
    }
    if (payload.assigneeName !== undefined) {
      const assigneeName = String(payload.assigneeName || '').trim();
      if (!assigneeName) {
        throw new BadRequestException('assigneeName обязателен');
      }
      task.assigneeId = undefined;
      task.assigneeName = assigneeName;
      if (payload.assigneeRole !== undefined) {
        task.assigneeRole = String(payload.assigneeRole || '').trim() || undefined;
      }
    } else if (payload.assigneeRole !== undefined && !task.assigneeId) {
      task.assigneeRole = String(payload.assigneeRole || '').trim() || undefined;
    }
    if (payload.deadline !== undefined) {
      task.deadline = payload.deadline ? new Date(payload.deadline) : null;
    }
    if (payload.priority !== undefined) {
      task.priority = this.normalizePriority(payload.priority);
    }
    if (payload.status !== undefined) {
      task.status = this.normalizeStatus(payload.status);
      task.completedAt = task.status === 'done' ? new Date() : null;
    }

    return this.tasksRepo.save(task);
  }

  async remove(id: string) {
    const task = await this.tasksRepo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Задача не найдена');
    await this.tasksRepo.delete(id);
    return { success: true };
  }

  private normalizePriority(value?: string): TaskPriority {
    if (value === 'low' || value === 'medium' || value === 'high' || value === 'urgent') {
      return value;
    }
    return 'medium';
  }

  private normalizeStatus(value?: string): TaskStatus {
    if (
      value === 'todo' ||
      value === 'in_progress' ||
      value === 'done' ||
      value === 'canceled'
    ) {
      return value;
    }
    throw new BadRequestException('Некорректный статус задачи');
  }
}
