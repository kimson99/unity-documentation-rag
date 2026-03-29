import { DynamicModule, Module } from '@nestjs/common';
import { AgentModule } from '../agent/agent.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [AgentModule],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {
  static http(): DynamicModule {
    return {
      module: ChatModule,
      controllers: [ChatController],
    };
  }
}
