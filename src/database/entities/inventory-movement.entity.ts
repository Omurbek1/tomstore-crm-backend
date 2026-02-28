import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type InventoryMovementType = 'in' | 'out' | 'adjustment';
export type InventoryOperationType =
  | 'sale'
  | 'purchase'
  | 'writeoff'
  | 'return_in'
  | 'return_out'
  | 'transfer_in'
  | 'transfer_out'
  | 'adjustment'
  | 'manual_in'
  | 'manual_out'
  | 'other';

@Entity('inventory_movements')
export class InventoryMovementEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @Column()
  productName: string;

  @Column({ nullable: true })
  branchName?: string;

  @Column({ type: 'varchar' })
  type: InventoryMovementType;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int' })
  stockAfter: number;

  @Column({ type: 'varchar', default: 'other' })
  operationType: InventoryOperationType;

  @Column({ nullable: true })
  reason?: string;

  @Column({ nullable: true })
  actorId?: string;

  @Column({ nullable: true })
  actorName?: string;

  @CreateDateColumn()
  createdAt: Date;
}
