import { TaskType } from '@google/generative-ai';
import { TextLoader } from '@langchain/classic/document_loaders/fs/text';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Injectable, Logger } from '@nestjs/common';
import { Document } from 'langchain';
import { ConfigService } from 'src/config/config.service';

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
    const loader = new TextLoader(filePath);
    const docs = await loader.load();
    return docs;
  }
}
