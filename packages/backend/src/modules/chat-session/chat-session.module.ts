import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatSession } from 'src/database/models/chat-session.model';
import { ChatSessionController } from './chat-session.controller';
import { ChatSessionService } from './chat-session.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChatSession])],
  providers: [ChatSessionService],
  exports: [ChatSessionService],
})
export class ChatSessionModule {
  static http(): DynamicModule {
    return {
      module: ChatSessionModule,
      controllers: [ChatSessionController],
    };
  }
}
