import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseModel } from './base.model';
import { Session } from './session.model';

export const Role = {
  Admin: 'admin',
  User: 'user',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

@Entity()
export class User extends BaseModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  hashedPassword: string;

  @Column()
  email: string;

  @Column()
  displayName: string;

  @Column()
  role: Role;

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];
}
