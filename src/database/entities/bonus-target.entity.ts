import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('targets')
export class BonusTargetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', default: 'global' })
  type: 'global' | 'personal';

  @Column({ nullable: true })
  managerId?: string;

  @Column({ type: 'double precision', default: 0 })
  amount: number;

  @Column({ type: 'double precision', default: 0 })
  reward: number;

  @Column({ type: 'timestamptz', nullable: true })
  deadline?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
