import { ApiProperty } from '@nestjs/swagger';

export class ChatSessionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  createdAt: Date;
}
