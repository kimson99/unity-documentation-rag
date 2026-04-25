import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseModel } from './base.model';
import { FileIndexing } from './file-indexing.model';

@Entity()
export class DocumentIndexing extends BaseModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ default: 0 })
  fileCount: number = 0;

  @OneToMany(
    () => FileIndexing,
    (fileIndexing) => fileIndexing.documentIndexing,
  )
  fileIndexings: FileIndexing[];
}
