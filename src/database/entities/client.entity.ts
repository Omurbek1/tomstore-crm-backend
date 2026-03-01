import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('clients')
export class ClientEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ type: 'date', nullable: true })
  birthDate?: string;

  @Column({ type: 'double precision', default: 0 })
  discountPercent: number;

  @Column({ type: 'double precision', default: 0 })
  birthdayDiscountPercent: number;

  @Column({ type: 'varchar', default: 'silver' })
  level: 'silver' | 'gold' | 'vip';

  @Column({ type: 'double precision', default: 0 })
  totalSpent: number;

  @Column({ type: 'double precision', default: 0 })
  cashbackRatePercent: number;

  @Column({ type: 'double precision', default: 0 })
  cashbackBalance: number;

  @Column({ type: 'int', default: 180 })
  cashbackExpiryDays: number;

  @Column({ type: 'timestamptz', nullable: true })
  cashbackExpiresAt?: Date | null;

  @Column({ type: 'boolean', default: false })
  bonusesBlocked: boolean;

  @Column({ nullable: true, unique: true })
  referralCode?: string;

  @Column({ nullable: true })
  referredByClientId?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
