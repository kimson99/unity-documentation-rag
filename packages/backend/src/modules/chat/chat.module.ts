import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from 'src/database/models/message.model';
import { AgentModule } from '../agent/agent.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [AgentModule, TypeOrmModule.forFeature([Message])],
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
