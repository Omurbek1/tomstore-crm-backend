import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('cash_shifts')
export class CashShiftEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  cashierId: string;

  @Column({ type: 'varchar' })
  cashierName: string;

  @Column({ type: 'varchar', nullable: true })
  branchName?: string;

  @Column({ type: 'varchar', default: 'open' })
  status: 'open' | 'closed';

  @Column({ type: 'timestamptz' })
  openedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  closedAt?: Date | null;

  @Column({ type: 'double precision', default: 0 })
  openingCash: number;

  @Column({ type: 'double precision', nullable: true })
  closingCash?: number | null;

  @Column({ type: 'double precision', nullable: true })
  expectedCash?: number | null;

  @Column({ type: 'double precision', nullable: true })
  difference?: number | null;

  @Column({ type: 'double precision', nullable: true })
  debtBefore?: number | null;

  @Column({ type: 'double precision', nullable: true })
  shortageAmount?: number | null;

  @Column({ type: 'double precision', nullable: true })
  overageAmount?: number | null;

  @Column({ type: 'double precision', nullable: true })
  debtAfter?: number | null;

  @Column({ type: 'text', nullable: true })
  noteOpen?: string;

  @Column({ type: 'text', nullable: true })
  noteClose?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
