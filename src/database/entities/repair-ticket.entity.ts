import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RepairEventEntity } from './repair-event.entity';

export type RepairStatus =
  | 'received'
  | 'to_service'
  | 'diagnostic'
  | 'ready'
  | 'returned'
  | 'canceled';

@Entity('repair_tickets')
export class RepairTicketEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  clientName: string;

  @Column({ type: 'varchar', nullable: true })
  clientPhone?: string;

  @Column({ type: 'varchar' })
  itemName: string;

  @Column({ type: 'varchar', nullable: true })
  serialNumber?: string;

  @Column({ type: 'text' })
  issue: string;

  @Column({ type: 'varchar', nullable: true })
  branchName?: string;

  @Column({ type: 'varchar', default: 'received' })
  status: RepairStatus;

  @OneToMany(() => RepairEventEntity, (event) => event.ticket, {
    cascade: false,
  })
  messages?: RepairEventEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
