import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiResponse,
} from '@nestjs/swagger';
import { SkipAuth } from '../auth/auth.decorator';
import { FileUploadResponseDto } from './file.dto';
import { FileService } from './file.service';

@ApiBearerAuth()
@Controller('/files')
export class FileController {
  constructor(private fileService: FileService) {}

  @SkipAuth()
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Files uploaded successfully',
    type: FileUploadResponseDto,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  public async uploadFile(
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<FileUploadResponseDto> {
    const savedFiles = await this.fileService.saveFiles(files);
    return {
      files: savedFiles.map((f) => ({
        id: f.id,
        key: f.key,
        filename: f.filename,
      })),
    };
  }
}
