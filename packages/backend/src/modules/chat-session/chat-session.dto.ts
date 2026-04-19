import { ApiProperty } from '@nestjs/swagger';

export class ChatSessionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  createdAt: Date;
}

export class GetChatSessionsRequestDto {
  @ApiProperty()
  take: number;

  @ApiProperty()
  skip: number;
}

export class GetChatSessionsResponseDto {
  @ApiProperty({ type: [ChatSessionDto] })
  sessions: ChatSessionDto[];

  @ApiProperty()
  total: number;
}
