import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseModel } from './base.model';
import { Message } from './message.model';
import { User } from './user.model';

@Entity()
export class ChatSession extends BaseModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @Column({ default: 'New Chat' })
  title: string;

  @Column({ type: 'float', default: 0.5 })
  temperature: number;

  @OneToMany(() => Message, (message) => message.session)
  messages: Message[];
}
