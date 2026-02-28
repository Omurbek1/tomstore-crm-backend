import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('marketing_kpis')
export class MarketingKpiEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  managerId: string;

  @Column({ type: 'varchar' })
  managerName: string;

  @Column({ type: 'varchar', nullable: true })
  managerRole?: string;

  @Column({ type: 'varchar', nullable: true })
  branchName?: string;

  @Column({ type: 'varchar' })
  month: string; // YYYY-MM

  @Column({ type: 'varchar', default: 'month' })
  planMode: 'week' | 'month';

  @Column({ type: 'date', nullable: true })
  periodStart?: Date | null;

  @Column({ type: 'date', nullable: true })
  periodEnd?: Date | null;

  @Column({ type: 'int', default: 0 })
  plannedPosts: number;

  @Column({ type: 'int', default: 0 })
  plannedReels: number;

  @Column({ type: 'int', default: 0 })
  publishedPosts: number;

  @Column({ type: 'int', default: 0 })
  publishedReels: number;

  @Column({ type: 'double precision', default: 0 })
  reach: number;

  @Column({ type: 'double precision', default: 0 })
  engagements: number;

  @Column({ type: 'double precision', default: 0 })
  followersGrowth: number;

  @Column({ type: 'double precision', default: 0 })
  erPercent: number;

  @Column({ type: 'double precision', default: 0 })
  kpiScore: number;

  @Column({ type: 'double precision', default: 0 })
  salaryBase: number;

  @Column({ type: 'double precision', default: 0 })
  salaryBonus: number;

  @Column({ type: 'double precision', default: 0 })
  salaryTotal: number;

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  planItems?: Array<{
    id: string;
    date: string; // YYYY-MM-DD
    type: 'post' | 'reels' | 'story' | 'other';
    title?: string;
    done: boolean;
  }>;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
