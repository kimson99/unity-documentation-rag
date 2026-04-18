import { TaskType } from '@google/generative-ai';
import { TextLoader } from '@langchain/classic/document_loaders/fs/text';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import * as cheerio from 'cheerio';
import { Document } from 'langchain';
import path from 'path';
import { ConfigService } from 'src/config/config.service';
import { DocumentIndexing } from 'src/database/models/document-indexing.model';
import {
  FileIndexing,
  FileIndexingStatus,
} from 'src/database/models/file-indexing.model';
import { File } from 'src/database/models/file.model';
import TurndownService from 'turndown';
import { In, Repository } from 'typeorm';
import { IndexDocumentsDto } from './indexing.dto';

@Injectable()
export class IndexingService {
  private vectorStore: PGVectorStore;
  private textSplitter: RecursiveCharacterTextSplitter;
  private supportedMimetypes = ['text/plain', 'text/html', 'text/markdown'];

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
      const embeddings = new GoogleGenerativeAIEmbeddings({
        model: 'gemini-embedding-001',
        taskType: TaskType.RETRIEVAL_DOCUMENT,
        apiKey: this.configService.googleChatConfig.apiKey,
        maxConcurrency: 1,
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

  public async indexFile(filePath: string) {
    await this.initVectorStore();
    this.initTextSplitter('html');
    const resolvedPath = path.join(process.cwd(), '.', filePath);
    console.log(resolvedPath);
    const docs = await this.loadDocument(resolvedPath);
    const splitDocs = await this.splitDocument(docs);
    this.logger.log(
      `Loaded ${docs.length} documents, split into ${splitDocs.length} chunks.`,
    );
    this.logger.debug(
      `Empty chunks: ${splitDocs.filter((doc) => doc.pageContent.trim() === '').length}`,
    );
    const testDocs = splitDocs
      .filter((doc) => doc.pageContent.trim().length > 0)
      .slice(0, 1);
    await this.storeVectors(testDocs);
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
    const documentIndexing = await this.documentIndexingRepository.save({});
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
      fileIds: files.map((file) => ({ id: file.id })),
    };
  }

  public async markFileIndexingComplete(dto: {
    fileId: string;
    documentIndexingId: string;
    status: FileIndexingStatus;
  }) {
    const { fileId, documentIndexingId, status } = dto;
    return await this.fileIndexingRepository.update(
      {
        fileId,
        documentIndexingId,
      },
      { status },
    );
  }

  public async getDocumentIndexing(documentIndexingId: string) {
    const documentIndexing = await this.documentIndexingRepository.findOne({
      where: { id: documentIndexingId },
      relations: { fileIndexings: true },
    });
    if (!documentIndexing) {
      throw new NotFoundException('Document indexing not found');
    }
    return documentIndexing;
  }

  private initTextSplitter(language?: 'html' | 'markdown') {
    if (!this.textSplitter) {
      const indexingConfig = this.configService.indexingConfig;
      this.textSplitter = language
        ? RecursiveCharacterTextSplitter.fromLanguage(language, indexingConfig)
        : new RecursiveCharacterTextSplitter(indexingConfig);
    }

    return this.textSplitter;
  }

  private async splitDocument(docs: Document[]) {
    return this.textSplitter.splitDocuments(docs);
  }

  private async storeVectors(vectors: Document[]) {
    return this.vectorStore.addDocuments(vectors);
  }

  private async loadDocument(filePath: string) {
    const ext = filePath.split('.').pop()?.toLowerCase();
    if (!ext || !['txt', 'html', 'md'].includes(ext)) {
      throw new Error(
        'Unsupported file type. Only .txt, .html, and .md are supported.',
      );
    }
    const loader = new TextLoader(filePath);
    const docs = await loader.load();

    if (ext === 'html') {
      this.logger.debug(`Extracting text from HTML document`);
      const turndownService = new TurndownService({
        codeBlockStyle: 'fenced',
        headingStyle: 'atx',
      });

      const rawHtml = docs[0].pageContent;
      const $ = cheerio.load(rawHtml);
      $('script, style, noscript').remove();
      const cleanedHtml = $('body').html() ?? '';

      docs[0].pageContent = turndownService.turndown(cleanedHtml);
    }

    return docs;
  }
}
