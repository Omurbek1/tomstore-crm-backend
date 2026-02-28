import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'canceled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

@Entity('tasks')
export class TaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', nullable: true })
  assigneeId?: string;

  @Column({ type: 'varchar', nullable: true })
  assigneeName?: string;

  @Column({ type: 'varchar', nullable: true })
  assigneeRole?: string;

  @Column({ type: 'varchar', nullable: true })
  createdById?: string;

  @Column({ type: 'varchar', nullable: true })
  createdByName?: string;

  @Column({ type: 'varchar', default: 'todo' })
  status: TaskStatus;

  @Column({ type: 'varchar', default: 'medium' })
  priority: TaskPriority;

  @Column({ type: 'timestamp', nullable: true })
  deadline?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
