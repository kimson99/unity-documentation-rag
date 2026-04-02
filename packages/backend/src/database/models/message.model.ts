import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseModel } from './base.model';
import { ChatSession } from './chat-session.model';

const MessageRole = {
  User: 'user',
  Assistant: 'assistant',
  System: 'system',
  Tool: 'tool',
} as const;

export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole];

@Entity()
export class Message extends BaseModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => ChatSession, (session) => session.messages, {
    onDelete: 'CASCADE',
  })
  session: ChatSession;

  @Column()
  sessionId: string;

  @Column()
  role: MessageRole;
}
