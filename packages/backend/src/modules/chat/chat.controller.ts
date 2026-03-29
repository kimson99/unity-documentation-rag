import { Controller, Post } from '@nestjs/common';
import { SkipAuth } from '../auth/auth.decorator';
import { ChatService } from './chat.service';

@Controller('/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('/stream')
  @SkipAuth()
  public async chat() {
    return this.chatService.streamChat('Hello, how are you?');
  }
}
