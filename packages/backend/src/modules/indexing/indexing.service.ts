import { TaskType } from '@google/generative-ai';
import { TextLoader } from '@langchain/classic/document_loaders/fs/text';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { VertexAIEmbeddings } from '@langchain/google-vertexai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import * as fs from 'fs';
import { Document } from 'langchain';
import path from 'path';
import { PDFParse } from 'pdf-parse';
import { extractHtmlToMarkdown } from 'src/common/html-extractor';
import { ConfigService, EMBEDDING_MODEL } from 'src/config/config.service';
import { DocumentIndexing } from 'src/database/models/document-indexing.model';
import {
  FileIndexing,
  FileIndexingStatus,
} from 'src/database/models/file-indexing.model';
import { File } from 'src/database/models/file.model';
import { In, Repository } from 'typeorm';
import {
  GetDocumentIndexingsDto,
  GetFileIndexingsDto,
  IndexDocumentsDto,
} from './indexing.dto';

@Injectable()
export class IndexingService {
  private vectorStore: PGVectorStore;
  private supportedMimetypes = [
    'text/plain',
    'text/html',
    'text/markdown',
    'application/pdf',
  ];

  private logger = new Logger(IndexingService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(File) private readonly fileRepository: Repository<File>,
    @InjectRepository(DocumentIndexing)
    private readonly documentIndexingRepository: Repository<DocumentIndexing>,
    @InjectRepository(FileIndexing)
    private readonly fileIndexingRepository: Repository<FileIndexing>,
    @InjectQueue('indexing') private readonly indexingQueue: Queue,
  ) {}

  private async initVectorStore() {
    if (!this.vectorStore) {
      const config = this.configService.googleChatConfig;
      const embeddings = config.useVertex
        ? new VertexAIEmbeddings({
            model: EMBEDDING_MODEL.GEMINI_EMBEDDING_001,
            apiKey: config.apiKey,
            vertexai: true,
            maxConcurrency: 5,
          })
        : new GoogleGenerativeAIEmbeddings({
            model: EMBEDDING_MODEL.GEMINI_EMBEDDING_001,
            taskType: TaskType.RETRIEVAL_DOCUMENT,
            apiKey: config.apiKey,
            maxConcurrency: 5,
          });

      this.vectorStore = await PGVectorStore.initialize(embeddings, {
        tableName: 'knowledge_base',
        postgresConnectionOptions: {
          connectionString: this.configService.pg.url,
        },
      });
    }
    return this.vectorStore;
  }

  public async getVectorStore() {
    return this.initVectorStore();
  }

  public async indexFile(
    fileKey: string,
    fileId: string,
    documentIndexingId: string,
  ) {
    await this.initVectorStore();
    const resolvedPath = path.resolve(process.cwd(), fileKey);
    const ext = fileKey.split('.').pop()?.toLowerCase();

    const splitterLanguage =
      ext === 'html' ? 'html' : ext === 'md' ? 'markdown' : undefined;
    const textSplitter = this.createTextSplitter(splitterLanguage);

    const docs = await this.loadDocument(resolvedPath);

    for (const doc of docs) {
      doc.metadata = { ...doc.metadata, fileId, documentIndexingId };
    }

    const splitDocs = await textSplitter.splitDocuments(docs);
    this.logger.log(
      `Loaded ${docs.length} documents, split into ${splitDocs.length} chunks.`,
    );

    const filteredDocs = splitDocs.filter(
      (doc) => doc.pageContent.trim().length > 0,
    );

    await this.vectorStore.delete({ filter: { fileId } });
    await this.vectorStore.addDocuments(filteredDocs);
  }

  public async queueIndexDocuments(dto: IndexDocumentsDto) {
    const files = await this.fileRepository.find({
      where: { id: In(dto.fileIds), mimetype: In(this.supportedMimetypes) },
      select: ['id', 'key'],
    });
    if (dto.fileIds.length !== files.length || files.length === 0) {
      throw new NotFoundException(
        'One or more files not found for the provided IDs',
      );
    }
    const documentIndexing = await this.documentIndexingRepository.save({
      title: `Indexing ${new Date().toISOString()}`,
      fileCount: files.length,
    });
    for (let i = 0; i < files.length; i += 10) {
      const fileBatch = files.slice(i, i + 10);
      await this.fileIndexingRepository.save(
        fileBatch.map((file) => ({
          fileId: file.id,
          documentIndexingId: documentIndexing.id,
          status: FileIndexingStatus.IN_PROGRESS,
        })),
      );
    }
    await this.indexingQueue.addBulk(
      files.map((file) => ({
        name: 'index-file',
        data: {
          fileId: file.id,
          fileKey: file.key,
          documentIndexingId: documentIndexing.id,
        },
      })),
    );
    return {
      documentIndexingId: documentIndexing.id,
      fileIds: files.map((file) => file.id),
    };
  }

  public async markFileIndexingComplete(dto: {
    fileId: string;
    documentIndexingId: string;
    status: FileIndexingStatus;
    error?: string;
  }) {
    const { fileId, documentIndexingId, status, error } = dto;
    return await this.fileIndexingRepository.update(
      { fileId, documentIndexingId },
      { status, error },
    );
  }

  public async getDocumentIndexings(dto: GetDocumentIndexingsDto) {
    const [documentIndexings, total] =
      await this.documentIndexingRepository.findAndCount({
        skip: dto.skip,
        take: dto.take,
        order: {
          createdAt: 'DESC',
        },
      });
    return {
      documentIndexings,
      total,
    };
  }

  public async getDocumentIndexing(documentIndexingId: string) {
    const documentIndexing = await this.documentIndexingRepository.findOne({
      where: { id: documentIndexingId },
    });
    if (!documentIndexing) {
      throw new NotFoundException('Document indexing not found');
    }
    return documentIndexing;
  }

  public async getFileIndexings(
    documentIndexingId: string,
    dto: GetFileIndexingsDto,
  ) {
    const [fileIndexings, total] =
      await this.fileIndexingRepository.findAndCount({
        skip: dto.skip,
        take: dto.take,
        where: {
          documentIndexingId,
        },
        order: {
          createdAt: 'DESC',
        },
        relations: {
          file: true,
        },
      });

    return {
      fileIndexings,
      total,
    };
  }

  private createTextSplitter(language?: 'html' | 'markdown') {
    const indexingConfig =
      this.configService.indexingConfig[EMBEDDING_MODEL.GEMINI_EMBEDDING_001];
    return language
      ? RecursiveCharacterTextSplitter.fromLanguage(language, indexingConfig)
      : new RecursiveCharacterTextSplitter(indexingConfig);
  }

  private async loadDocument(filePath: string) {
    const ext = filePath.split('.').pop()?.toLowerCase();
    if (!ext || !['txt', 'html', 'md', 'pdf'].includes(ext)) {
      throw new Error(
        'Unsupported file type. Only .txt, .html, .md, and .pdf are supported.',
      );
    }

    if (ext === 'pdf') {
      this.logger.debug(`Extracting text from PDF document`);
      const dataBuffer = fs.readFileSync(filePath);
      const parser = new PDFParse({ data: dataBuffer });
      const result = await parser.getText();
      return [
        new Document({
          pageContent: result.text,
          metadata: {
            source: filePath,
            pages: result.pages.length,
          },
        }),
      ];
    }

    const loader = new TextLoader(filePath);
    const docs = await loader.load();

    if (ext === 'html') {
      this.logger.debug(`Extracting text from HTML document`);
      docs[0].pageContent = extractHtmlToMarkdown(docs[0].pageContent);
    }

    return docs;
  }
}
