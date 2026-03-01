import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('client_sms_logs')
export class ClientSmsLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clientId: string;

  @Column()
  phone: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', default: 'queued' })
  status: 'queued' | 'sent' | 'failed';

  @Column({ type: 'text', nullable: true })
  error?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

