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
    type: String,
    description: 'Document indexing job ID',
  })
  documentIndexingId: string;

  @ApiProperty({
    type: [String],
  })
  fileIds: string[];
}

export class FileIndexingDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  fileId: string;

  @ApiProperty({ type: String })
  documentIndexingId: string;

  @ApiProperty({
    type: String,
    description: 'in-progress | completed | failed',
  })
  status: string;
}

export class DocumentIndexingDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: [FileIndexingDto] })
  fileIndexings: FileIndexingDto[];
}
