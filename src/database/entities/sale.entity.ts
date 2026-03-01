import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sales')
export class SaleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clientName: string;

  @Column({ nullable: true })
  clientPhone?: string;

  @Column({ nullable: true })
  clientAddress?: string;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ nullable: true })
  clientId?: string;

  @Column()
  productId: string;

  @Column()
  productName: string;

  @Column({ nullable: true })
  supplierSnapshot?: string;

  @Column({ type: 'double precision', default: 0 })
  costPriceSnapshot: number;

  @Column({ type: 'double precision', default: 0 })
  price: number;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'double precision', default: 0 })
  total: number;

  @Column({ type: 'double precision', nullable: true })
  discount?: number;

  @Column({ type: 'double precision', nullable: true })
  loyaltyDiscountPercent?: number;

  @Column({ default: 'Центральный' })
  branch: string;

  @Column({ type: 'uuid', nullable: true })
  shiftId?: string;

  @Column({ type: 'varchar', default: 'cash' })
  paymentType: 'cash' | 'installment' | 'hybrid' | 'booking' | 'manual';

  @Column({ type: 'varchar', nullable: true })
  paymentLabel?: string;

  @Column({ type: 'double precision', nullable: true })
  hybridCash?: number;

  @Column({ type: 'double precision', nullable: true })
  hybridCard?: number;

  @Column({ type: 'double precision', nullable: true })
  hybridTransfer?: number;

  @Column({ type: 'int', nullable: true })
  installmentMonths?: number;

  @Column({ type: 'double precision', default: 0 })
  managerEarnings: number;

  @Column({ type: 'double precision', nullable: true })
  potentialEarnings?: number;

  @Column({ type: 'double precision', nullable: true })
  baseManagerEarnings?: number;

  @Column({ type: 'varchar', default: 'reserved' })
  deliveryStatus:
    | 'reserved'
    | 'ready'
    | 'on_way'
    | 'picked_up'
    | 'delivered'
    | 'canceled';

  @Column({ type: 'varchar', default: 'office' })
  saleType: 'office' | 'delivery';

  @Column({ nullable: true })
  managerId?: string;

  @Column({ default: 'Unknown' })
  managerName: string;

  @Column({ type: 'timestamptz', nullable: true })
  bookingDeadline?: Date | null;

  @Column({ type: 'double precision', nullable: true })
  bookingDeposit?: number | null;

  @Column({ type: 'double precision', nullable: true })
  bookingBuyout?: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  manualDate?: Date | null;

  @Column({ nullable: true })
  updatedBy?: string;

  @Column({ type: 'double precision', nullable: true })
  deliveryCost?: number;

  @Column({ type: 'boolean', nullable: true })
  deliveryPaidByCompany?: boolean;

  @Column({ type: 'double precision', nullable: true })
  cashbackUsed?: number;

  @Column({ type: 'double precision', nullable: true })
  cashbackAccrued?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
