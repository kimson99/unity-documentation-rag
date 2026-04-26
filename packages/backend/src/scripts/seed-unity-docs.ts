import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Injectable, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigModule } from 'src/config/config.module';
import { DatabaseModule } from 'src/database/database.module';
import { DocumentIndexing } from 'src/database/models/document-indexing.model';
import {
  FileIndexing,
  FileIndexingStatus,
} from 'src/database/models/file-indexing.model';
import { File } from 'src/database/models/file.model';
import { QueueModule } from 'src/database/queue.module';
import { Repository } from 'typeorm';

@Injectable()
class SeedService {
  constructor(
    @InjectRepository(File) private fileRepo: Repository<File>,
    @InjectRepository(DocumentIndexing)
    private documentIndexingRepo: Repository<DocumentIndexing>,
    @InjectRepository(FileIndexing)
    private fileIndexingRepo: Repository<FileIndexing>,
    @InjectQueue('indexing') private indexingQueue: Queue,
  ) {}

  private findHtmlFiles(dir: string): string[] {
    const results: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...this.findHtmlFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        results.push(fullPath);
      }
    }
    return results;
  }

  async run(docsDir: string, limit?: number, batchSize = 500) {
    const resolvedDir = path.resolve(docsDir);
    console.log(`Scanning ${resolvedDir}...`);

    let filePaths = this.findHtmlFiles(resolvedDir);
    console.log(`Found ${filePaths.length} HTML files`);

    if (limit) {
      filePaths = filePaths.slice(0, limit);
      console.log(`Limiting to ${limit} files`);
    }

    // Skip files already tracked in the DB (idempotent re-runs)
    const existingKeys = new Set(
      (await this.fileRepo.find({ select: ['key'] })).map((f) => f.key),
    );
    const newPaths = filePaths.filter((fp) => !existingKeys.has(fp));
    console.log(
      `${newPaths.length} new files to seed (${filePaths.length - newPaths.length} already in DB)`,
    );

    if (newPaths.length === 0) {
      console.log('Nothing to do.');
      return;
    }

    // Save File records in batches of 100
    const savedFiles: File[] = [];
    for (let i = 0; i < newPaths.length; i += 100) {
      const batch = newPaths.slice(i, i + 100);
      const records = batch.map((fp) =>
        this.fileRepo.create({
          filename: path.basename(fp),
          size: fs.statSync(fp).size,
          mimetype: 'text/html',
          key: fp,
        }),
      );
      const saved = await this.fileRepo.save(records);
      savedFiles.push(...saved);
      process.stdout.write(
        `\rSaved file records: ${Math.min(i + 100, newPaths.length)} / ${newPaths.length}`,
      );
    }
    console.log();

    // Queue indexing jobs in batches
    let totalQueued = 0;
    for (let i = 0; i < savedFiles.length; i += batchSize) {
      const batch = savedFiles.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;

      const documentIndexing = await this.documentIndexingRepo.save({
        title: `Unity Docs — Batch ${batchNum} (${new Date().toISOString()})`,
        fileCount: batch.length,
      });

      await this.fileIndexingRepo.save(
        batch.map((f) => ({
          fileId: f.id,
          documentIndexingId: documentIndexing.id,
          status: FileIndexingStatus.IN_PROGRESS,
        })),
      );

      await this.indexingQueue.addBulk(
        batch.map((f) => ({
          name: 'index-file',
          data: {
            fileId: f.id,
            fileKey: f.key,
            documentIndexingId: documentIndexing.id,
          },
          opts: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: { age: 60 * 60, count: 10 },
            removeOnFail: { age: 60 * 60, count: 10 },
          },
        })),
      );

      totalQueued += batch.length;
      console.log(`Queued: ${totalQueued} / ${savedFiles.length}`);
    }

    console.log(`\nDone. ${totalQueued} files queued for indexing.`);
    console.log(
      'Start the backend server to begin processing jobs from the queue.',
    );
  }
}

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    QueueModule,
    BullModule.registerQueue({ name: 'indexing' }),
    TypeOrmModule.forFeature([File, DocumentIndexing, FileIndexing]),
  ],
  providers: [SeedService],
})
class AppModule {}

async function bootstrap() {
  const args = process.argv.slice(2);

  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : undefined;
  };

  const docsDir = get('--dir');
  if (!docsDir) {
    console.error(
      'Usage: pnpm ts src/scripts/seed-unity-docs.ts --dir <path> [--limit <n>] [--batch-size <n>]',
    );
    process.exit(1);
  }

  const limit = get('--limit') ? parseInt(get('--limit')!) : undefined;
  const batchSize = get('--batch-size') ? parseInt(get('--batch-size')!) : 500;

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const service = app.get(SeedService);
    await service.run(docsDir, limit, batchSize);
  } finally {
    await app.close();
  }
}

void bootstrap();
