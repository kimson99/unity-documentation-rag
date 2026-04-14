import {
  BaseEntity,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FileIndexing } from './file-indexing.model';

export const DocumentIndexingStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type DocumentIndexingStatus =
  (typeof DocumentIndexingStatus)[keyof typeof DocumentIndexingStatus];

@Entity()
export class DocumentIndexing extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  status: DocumentIndexingStatus;

  @OneToMany(
    () => FileIndexing,
    (fileIndexing) => fileIndexing.documentIndexing,
  )
  fileIndexings: FileIndexing[];
}
