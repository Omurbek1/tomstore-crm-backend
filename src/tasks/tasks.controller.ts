import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TaskPriority, TaskStatus } from '../database/entities/task.entity';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(
    @Query('q') q?: string,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
    @Query('assigneeId') assigneeId?: string,
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
  ) {
    const limit = limitRaw !== undefined ? Number(limitRaw) : undefined;
    const offset = offsetRaw !== undefined ? Number(offsetRaw) : undefined;
    return this.tasksService.findAll({
      q,
      status,
      priority,
      assigneeId,
      limit,
      offset,
    });
  }

  @Post()
  create(
    @Body()
    body: {
      title?: string;
      description?: string;
      assigneeId?: string;
      assigneeName?: string;
      assigneeRole?: string;
      deadline?: string;
      priority?: TaskPriority;
      createdById?: string;
      createdByName?: string;
    },
  ) {
    return this.tasksService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
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
    return this.tasksService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
