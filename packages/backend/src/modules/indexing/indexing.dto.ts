import { ApiProperty } from '@nestjs/swagger';

export class IndexDocumentsDto {
  @ApiProperty({
    type: [String],
    description: 'Array of file IDs to be indexed',
  })
  fileIds: string[];
}

export class IndexDocumentResponseDto {
  @ApiProperty({
    type: [String],
  })
  fileIds: string[];
}
