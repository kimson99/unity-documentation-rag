import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { IndexDocumentResponseDto, IndexDocumentsDto } from './indexing.dto';
import { IndexingService } from './indexing.service';

@Controller('/indexing')
@ApiBearerAuth()
export class IndexingController {
  constructor(private readonly indexingService: IndexingService) {}

  @Post('/')
  @ApiResponse({
    status: 201,
    description: 'Files have been queued for indexing',
    type: IndexDocumentResponseDto,
  })
  public async index(@Body() dto: IndexDocumentsDto) {
    return this.indexingService.queueIndexDocuments(dto);
  }

  @Get('/:documentIndexingId')
  public async getDocumentIndexing(
    @Param('documentIndexingId') documentIndexingId: string,
  ) {
    return this.indexingService.getDocumentIndexing(documentIndexingId);
  }
}
