import { Controller, Post, Req } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { type Request } from 'express';
import { ChatSessionDto } from './chat-session.dto';
import { ChatSessionService } from './chat-session.service';

@Controller('/chat-session')
export class ChatSessionController {
  constructor(private readonly chatSessionService: ChatSessionService) {}

  @Post('/create')
  @ApiResponse({
    status: 201,
    description: 'The chat session has been successfully created.',
    type: () => ChatSessionDto,
  })
  public async createSession(@Req() req: Request): Promise<ChatSessionDto> {
    const session = await this.chatSessionService.createSession(req.user.id);
    return session;
  }
}
