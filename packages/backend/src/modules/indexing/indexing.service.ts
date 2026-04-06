import { TaskType } from '@google/generative-ai';
import { TextLoader } from '@langchain/classic/document_loaders/fs/text';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { Document } from 'langchain';
import { ConfigService } from 'src/config/config.service';
import TurndownService from 'turndown';

@Injectable()
export class IndexingService {
  private vectorStore: PGVectorStore;
  private textSplitter: RecursiveCharacterTextSplitter;

  private logger = new Logger(IndexingService.name);

  constructor(private readonly configService: ConfigService) {}

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

  public async testIndexing(filePath: string) {
    await this.initVectorStore();
    this.initTextSplitter('html');
    const docs = await this.loadDocument(filePath);
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
