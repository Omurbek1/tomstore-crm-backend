import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('client_loyalty_transactions')
export class ClientLoyaltyTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clientId: string;

  @Column({ type: 'varchar' })
  type:
    | 'cashback_accrual'
    | 'cashback_spend'
    | 'cashback_expire'
    | 'referral_bonus'
    | 'manual_adjust';

  @Column({ type: 'double precision' })
  amount: number;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date | null;

  @Column({ nullable: true })
  saleId?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

