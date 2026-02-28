import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type TrainingMaterialType =
  | 'video'
  | 'document'
  | 'link'
  | 'image'
  | 'other';

@Entity('training_materials')
export class TrainingMaterialEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', default: 'other' })
  type: TrainingMaterialType;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'varchar', nullable: true })
  folderId?: string | null;

  @Column({ type: 'int', default: 0 })
  lessonOrder: number;

  @Column({ type: 'text', nullable: true })
  thumbnailUrl?: string;

  @Column({ nullable: true })
  createdById?: string;

  @Column({ nullable: true })
  createdByName?: string;

  @Column({ type: 'boolean', default: true })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
