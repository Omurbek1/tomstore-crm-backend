import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  login: string;

  @Column({ unique: true })
  name: string;

  @Column()
  password: string;

  @Column({ type: 'varchar', default: 'manager' })
  role: 'superadmin' | 'admin' | 'manager' | 'storekeeper' | 'cashier';

  @Column({ type: 'simple-array', nullable: true })
  roles?: string[];

  @Column({ type: 'varchar', default: 'commission' })
  salaryType: 'commission' | 'fixed';

  @Column({ type: 'double precision', default: 0 })
  fixedMonthlySalary: number;

  @Column({ type: 'boolean', default: false })
  canManageProducts: boolean;

  @Column({ type: 'varchar', nullable: true })
  theme?: 'light' | 'dark';

  @Column({ type: 'varchar', nullable: true })
  phone?: string;

  @Column({ type: 'varchar', nullable: true })
  address?: string;

  @Column({ type: 'int', nullable: true })
  birthYear?: number;

  @Column({ type: 'timestamp', nullable: true })
  birthDate?: Date;

  @Column({ type: 'varchar', nullable: true })
  photoUrl?: string;

  @Column({ type: 'varchar', nullable: true })
  branchId?: string;

  @Column({ type: 'varchar', nullable: true })
  branchName?: string;

  @Column({ type: 'simple-array', nullable: true })
  managedBranchIds?: string[];

  @Column({ type: 'simple-array', nullable: true })
  managedBranchNames?: string[];

  @Column({ type: 'boolean', default: false })
  deleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
