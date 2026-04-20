import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatSession } from 'src/database/models/chat-session.model';
import { Repository } from 'typeorm';
import { GetChatSessionsRequestDto } from './chat-session.dto';

export class ChatSessionService {
  constructor(
    @InjectRepository(ChatSession)
    private readonly chatSessionRepo: Repository<ChatSession>,
  ) {}

  public async createSession(userId: string): Promise<ChatSession> {
    const session = this.chatSessionRepo.create({ userId });
    return this.chatSessionRepo.save(session);
  }

  public async getSessionsByUserId(
    userId: string,
    dto: GetChatSessionsRequestDto,
  ): Promise<[ChatSession[], number]> {
    return this.chatSessionRepo.findAndCount({
      where: { userId },
      skip: dto.skip,
      take: dto.take,
      order: {
        updatedAt: {
          direction: 'desc',
        },
      },
    });
  }

  public async getSessionById(userId: string, sessionId: string) {
    const session = await this.chatSessionRepo.findOne({
      where: {
        id: sessionId,
        userId,
      },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }
}
