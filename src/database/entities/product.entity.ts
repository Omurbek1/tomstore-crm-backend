import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  category: string;

  @Column({ type: 'double precision', default: 0 })
  costPrice: number;

  @Column({ type: 'double precision', default: 0 })
  sellingPrice: number;

  @Column({ nullable: true })
  supplier?: string;

  @Column({ type: 'double precision', nullable: true })
  managerEarnings?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
