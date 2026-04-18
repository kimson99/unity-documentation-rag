import { BaseEntity, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { FileIndexing } from './file-indexing.model';

@Entity()
export class DocumentIndexing extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(
    () => FileIndexing,
    (fileIndexing) => fileIndexing.documentIndexing,
  )
  fileIndexings: FileIndexing[];
}
