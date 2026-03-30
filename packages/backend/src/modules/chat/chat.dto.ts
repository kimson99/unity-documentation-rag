import { ApiProperty } from '@nestjs/swagger';
import { UIMessage } from 'ai';

export class ChatStreamDto {
  @ApiProperty()
  messages: UIMessage[];
}
