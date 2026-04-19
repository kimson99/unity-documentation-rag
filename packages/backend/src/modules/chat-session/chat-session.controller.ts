import { Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { type Request } from 'express';
import {
  ChatSessionDto,
  GetChatSessionsRequestDto,
  GetChatSessionsResponseDto,
} from './chat-session.dto';
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

  @Get('/')
  @ApiResponse({
    status: 200,
    description: 'List of chat sessions for the user.',
    type: () => GetChatSessionsResponseDto,
  })
  public async getSessionsByUserId(
    @Req() req: Request,
    @Query() dto: GetChatSessionsRequestDto,
  ): Promise<GetChatSessionsResponseDto> {
    const [sessions, total] = await this.chatSessionService.getSessionsByUserId(
      req.user.id,
      dto,
    );
    return {
      sessions,
      total,
    };
  }
}
