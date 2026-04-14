import { ApiProperty } from '@nestjs/swagger';

export class FileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  filename: string;
}

export class FileUploadResponseDto {
  @ApiProperty({ type: () => [FileDto] })
  files: FileDto[];
}
