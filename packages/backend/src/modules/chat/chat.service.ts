import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UIMessage } from 'ai';
import { Message } from 'src/database/models/message.model';
import { Repository } from 'typeorm';
import { AgentService } from '../agent/agent.service';
import {
  ChatMessageMetadata,
  GetMessagesBySessionIdRequestDto,
} from './chat.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly agentService: AgentService,
    @InjectRepository(Message) private messageRepo: Repository<Message>,
  ) {}

  public async streamChat({ messages }: { messages: UIMessage[] }) {
    const latestUserMessage = messages[messages.length - 1];
    const sessionId = (latestUserMessage.metadata as ChatMessageMetadata)
      ?.sessionId;

    await this.saveMessage({
      parts: latestUserMessage.parts,
      role: 'user',
      sessionId,
    });

    return this.agentService.streamChat(messages, async (finalParts: any[]) => {
      await this.saveMessage({
        parts: finalParts,
        role: 'assistant',
        sessionId,
      });
    });
  }

  public async saveMessage(message: Partial<Message>) {
    return this.messageRepo.save(message);
  }

  public async getMessagesBySessionId(
    sessionId: string,
    dto: GetMessagesBySessionIdRequestDto,
  ) {
    return this.messageRepo.findAndCount({
      where: { sessionId },
      skip: dto.skip,
      take: dto.take,
    });
  }
}
