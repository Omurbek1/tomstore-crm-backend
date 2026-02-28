import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('app_settings')
export class AppSettingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'TOMSTORE' })
  companyName: string;

  @Column({ nullable: true })
  companyLogoUrl?: string;

  @Column('text', { array: true, default: () => "'{}'" })
  manualPaymentTypes: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
