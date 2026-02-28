import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type ComboItem = {
  productId: string;
  quantity: number;
};

@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  category: string;

  @Column({ type: 'jsonb', nullable: true })
  categories?: string[] | null;

  @Column({ type: 'double precision', default: 0 })
  costPrice: number;

  @Column({ type: 'double precision', default: 0 })
  sellingPrice: number;

  @Column({ nullable: true })
  supplier?: string;

  @Column({ type: 'varchar', nullable: true })
  branchName?: string;

  @Column({ nullable: true })
  photoUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  photoUrls?: string[] | null;

  @Column({ type: 'text', nullable: true })
  characteristics?: string;

  @Column({ type: 'double precision', nullable: true })
  managerEarnings?: number;

  @Column({ type: 'double precision', nullable: true })
  managerPercent?: number;

  @Column({ type: 'int', default: 0 })
  stockQty: number;

  @Column({ type: 'boolean', default: false })
  isCombo: boolean;

  @Column({ type: 'jsonb', nullable: true })
  comboItems?: ComboItem[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
