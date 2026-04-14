import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DocumentIndexing } from './document-indexing.model';
import { File } from './file.model';

@Entity()
export class FileIndexing extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => File, (file) => file.id, { onDelete: 'CASCADE' })
  file: File;

  @Column()
  fileId: string;

  @ManyToOne(
    () => DocumentIndexing,
    (documentIndexing) => documentIndexing.id,
    { onDelete: 'CASCADE' },
  )
  documentIndexing: DocumentIndexing;

  @Column()
  documentIndexingId: string;
}
