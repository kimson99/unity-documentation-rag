import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

export class BaseModel {
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
