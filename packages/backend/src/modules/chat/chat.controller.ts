import { Body, Controller, Post, Res } from '@nestjs/common';
import { pipeUIMessageStreamToResponse } from 'ai';
import { type Response } from 'express';
import { SkipAuth } from '../auth/auth.decorator';
import { ChatStreamDto } from './chat.dto';
import { ChatService } from './chat.service';

@Controller('/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('/stream')
  @SkipAuth()
  public async chat(@Body() dto: ChatStreamDto, @Res() res: Response) {
    pipeUIMessageStreamToResponse({
      stream: await this.chatService.streamChat(dto),
      response: res,
    });
  }
}
