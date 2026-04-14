import {
  BaseEntity,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FileIndexing } from './file-indexing.model';

@Entity()
export class File extends BaseEntity {
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
