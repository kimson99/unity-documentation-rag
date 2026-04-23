import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { pipeUIMessageStreamToResponse } from 'ai';
import { type Response } from 'express';
import { SkipAuth } from '../auth/auth.decorator';
import {
  ChatStreamDto,
  GetMessagesBySessionIdRequestDto,
  GetMessagesBySessionIdResponseDto,
} from './chat.dto';
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

  @Get('/sessions/:sessionId/messages')
  @ApiResponse({
    status: 200,
    type: () => GetMessagesBySessionIdResponseDto,
  })
  public async getMessagesBySessionId(
    @Param('sessionId') sessionId: string,
    @Query() dto: GetMessagesBySessionIdRequestDto,
  ): Promise<GetMessagesBySessionIdResponseDto> {
    const [messages, total] = await this.chatService.getMessagesBySessionId(
      sessionId,
      dto,
    );

    return {
      messages: messages.map((m) => ({
        id: m.id,
        parts: m.parts,
        role: m.role,
        createdAt: m.createdAt,
      })),
      total,
    };
  }
}
