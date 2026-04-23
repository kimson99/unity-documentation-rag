import { ApiProperty } from '@nestjs/swagger';
import { UIMessage } from 'ai';

export class ChatStreamDto {
  @ApiProperty()
  messages: UIMessage[];
}

export type ChatMessageMetadata = {
  sessionId?: string;
};

export class GetMessagesBySessionIdRequestDto {
  @ApiProperty()
  skip: number;

  @ApiProperty()
  take: number;
}

export class MessageTextPartDto {
  @ApiProperty({
    example: 'text',
    enum: ['text'],
    description: 'The type of the message part',
  })
  type: 'text';

  @ApiProperty({
    example: 'Here is the information you requested...',
    description: 'The actual text content',
  })
  text: string;
}

export class ChatMessageDto {
  @ApiProperty({
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    enum: ['system', 'user', 'assistant', 'data', 'tool'],
    example: 'assistant',
    description: 'The role of the message author',
  })
  role: 'system' | 'user' | 'assistant' | 'data' | 'tool';

  @ApiProperty({
    type: [MessageTextPartDto],
    description: 'Array of message parts (required by AI SDK v5+)',
  })
  parts: MessageTextPartDto[];

  @ApiProperty({
    type: Date,
    example: '2026-04-19T10:30:00Z',
  })
  createdAt: Date;
}

export class GetMessagesBySessionIdResponseDto {
  @ApiProperty({ type: () => [ChatMessageDto] })
  messages: ChatMessageDto[];

  @ApiProperty()
  total: number;
}
