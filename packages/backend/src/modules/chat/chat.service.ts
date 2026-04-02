import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UIMessage } from 'ai';
import { Message } from 'src/database/models/message.model';
import { Repository } from 'typeorm';
import { AgentService } from '../agent/agent.service';
import { ChatMessageMetadata } from './chat.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly agentService: AgentService,
    @InjectRepository(Message) private messageRepo: Repository<Message>,
  ) {}

  public async streamChat({ messages }: { messages: UIMessage[] }) {
    await this.saveMessage({
      content:
        messages[messages.length - 1].parts.find((part) => part.type === 'text')
          ?.text || '',
      role: 'user',
      sessionId: (messages[messages.length - 1].metadata as ChatMessageMetadata)
        ?.sessionId,
    });
    return this.agentService.streamChat(messages, async (content: string) => {
      await this.saveMessage({
        content,
        role: 'assistant',
      });
    });
  }

  public async saveMessage(message: Partial<Message>) {
    return this.messageRepo.save(message);
  }
}
