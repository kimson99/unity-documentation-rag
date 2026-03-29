import { Injectable } from '@nestjs/common';
import { AgentService } from '../agent/agent.service';

@Injectable()
export class ChatService {
  constructor(private readonly agentService: AgentService) {}

  public async streamChat(message: string) {
    return this.agentService.streamChat(message);
  }
}
