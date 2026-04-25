import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import {
  DocumentIndexingDto,
  GetDocumentIndexingsDto,
  GetDocumentIndexingsResponseDto,
  GetFileIndexingsDto,
  GetFileIndexingsResponseDto,
  IndexDocumentResponseDto,
  IndexDocumentsDto,
} from './indexing.dto';
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

  @Get('/')
  @ApiResponse({ status: 200, type: GetDocumentIndexingsResponseDto })
  public async getDocumentIndexings(
    @Query() dto: GetDocumentIndexingsDto,
  ): Promise<GetDocumentIndexingsResponseDto> {
    const { documentIndexings, total } =
      await this.indexingService.getDocumentIndexings(dto);
    return {
      documentIndexings: documentIndexings,
      total: total,
    };
  }

  @Get('/:documentIndexingId')
  @ApiResponse({ status: 200, type: DocumentIndexingDto })
  public async getDocumentIndexing(
    @Param('documentIndexingId') documentIndexingId: string,
  ) {
    return this.indexingService.getDocumentIndexing(documentIndexingId);
  }

  @Get('/:documentIndexingId/files')
  @ApiResponse({ status: 200, type: GetFileIndexingsResponseDto })
  public async getIndexingFiles(
    @Param('documentIndexingId') documentIndexingId: string,
    @Query() dto: GetFileIndexingsDto,
  ): Promise<GetFileIndexingsResponseDto> {
    const { fileIndexings, total } =
      await this.indexingService.getFileIndexings(documentIndexingId, dto);
    return {
      fileIndexings,
      total,
    };
  }
}
