import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('bonuses')
export class BonusEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  managerId?: string;

  @Column({ default: 'Unknown' })
  managerName: string;

  @Column({ type: 'double precision', default: 0 })
  amount: number;

  @Column({ default: 'Без комментария' })
  reason: string;

  @Column({ nullable: true })
  addedBy?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
