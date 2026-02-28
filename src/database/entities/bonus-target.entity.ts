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

  @Column({ type: 'varchar', default: 'money' })
  rewardType: 'money' | 'material';

  @Column({ type: 'varchar', nullable: true })
  rewardText?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  deadline?: Date;

  @Column({ type: 'boolean', default: false })
  rewardIssued: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  rewardIssuedAt?: Date | null;

  @Column({ type: 'varchar', nullable: true })
  rewardApprovedBy?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
