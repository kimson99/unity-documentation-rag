import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UIMessage } from 'ai';
import { ChatSession } from 'src/database/models/chat-session.model';
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
    @InjectRepository(ChatSession)
    private chatSessionRepo: Repository<ChatSession>,
  ) {}

  private logger = new Logger(ChatService.name);

  public async streamChat({ messages }: { messages: UIMessage[] }) {
    const latestUserMessage = messages[messages.length - 1];
    const sessionId = (latestUserMessage.metadata as ChatMessageMetadata)
      ?.sessionId;

    await this.saveMessage({
      parts: latestUserMessage.parts,
      role: 'user',
      sessionId,
    });

    const isFirstMessage = messages.length === 1;

    return this.agentService.streamChat(messages, async (finalParts: any[]) => {
      await this.saveMessage({
        parts: finalParts,
        role: 'assistant',
        sessionId,
      });

      if (isFirstMessage) {
        const userText = latestUserMessage.parts
          .filter((p) => p.type === 'text')
          .map((p) => (p as { type: 'text'; text: string }).text)
          .join(' ');
        this.agentService
          .generateTitle(userText)
          .then((title) =>
            this.chatSessionRepo.update({ id: sessionId }, { title }),
          )
          .catch((error) =>
            this.logger.error(
              'Failed to update session %s title: %o',
              sessionId,
              error,
            ),
          );
      }
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
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
