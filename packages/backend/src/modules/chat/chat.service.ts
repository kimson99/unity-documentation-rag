import { Injectable } from '@nestjs/common';
import { UIMessage } from 'ai';
import { AgentService } from '../agent/agent.service';

@Injectable()
export class ChatService {
  constructor(private readonly agentService: AgentService) {}

  public async streamChat({ messages }: { messages: UIMessage[] }) {
    return this.agentService.streamChat(messages);
  }
}
