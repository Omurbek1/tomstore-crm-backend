import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('expenses')
export class ExpenseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'double precision', default: 0 })
  amount: number;

  @Column({ default: 'Прочее' })
  category: string;

  @Column({ nullable: true })
  comment?: string;

  @Column({ nullable: true })
  managerId?: string;

  @Column({ nullable: true })
  managerName?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
