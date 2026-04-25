import { ApiProperty } from '@nestjs/swagger';
import { FileIndexingStatus } from 'src/database/models/file-indexing.model';
import { FileDto } from '../file/file.dto';

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

export class DocumentIndexingDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty()
  fileCount: number;

  @ApiProperty()
  createdAt: Date;
}

export class GetDocumentIndexingsDto {
  @ApiProperty()
  skip: number;

  @ApiProperty()
  take: number;
}

export class GetDocumentIndexingsResponseDto {
  @ApiProperty({ type: () => [DocumentIndexingDto] })
  documentIndexings: DocumentIndexingDto[];

  @ApiProperty()
  total: number;
}

export class GetFileIndexingsDto {
  @ApiProperty()
  skip: number;

  @ApiProperty()
  take: number;
}

export class FileIndexingDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: () => FileDto })
  file: FileDto;

  @ApiProperty({ enumName: 'FileIndexingStatus', enum: FileIndexingStatus })
  status: FileIndexingStatus;

  @ApiProperty({ nullable: true })
  error: string | null;

  @ApiProperty()
  createdAt: Date;
}

export class GetFileIndexingsResponseDto {
  @ApiProperty({ type: () => [FileIndexingDto] })
  fileIndexings: FileIndexingDto[];

  @ApiProperty()
  total: number;
}
