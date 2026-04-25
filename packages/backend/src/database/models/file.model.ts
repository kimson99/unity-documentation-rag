import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseModel } from './base.model';
import { FileIndexing } from './file-indexing.model';

@Entity()
export class File extends BaseModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column()
  mimetype: string;

  @Column()
  key: string;

  @OneToMany(() => FileIndexing, (fileIndexing) => fileIndexing.file)
  fileIndexings: FileIndexing[];
}
