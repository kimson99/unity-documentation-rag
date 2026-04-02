import { InjectRepository } from '@nestjs/typeorm';
import { ChatSession } from 'src/database/models/chat-session.model';
import { Repository } from 'typeorm';

export class ChatSessionService {
  constructor(
    @InjectRepository(ChatSession)
    private readonly chatSessionRepo: Repository<ChatSession>,
  ) {}

  public async createSession(userId: string): Promise<ChatSession> {
    const session = this.chatSessionRepo.create({ userId });
    return this.chatSessionRepo.save(session);
  }
}
