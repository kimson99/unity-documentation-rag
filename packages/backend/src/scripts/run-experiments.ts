import { Injectable, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import fs from 'fs';
import path from 'path';
import { DataSource } from 'typeorm';
import { ConfigModule } from 'src/config/config.module';
import { DatabaseModule } from 'src/database/database.module';
import { QueueModule } from 'src/database/queue.module';
import { AgentModule } from 'src/modules/agent/agent.module';
import { IndexingService } from 'src/modules/indexing/indexing.service';
import { IndexingModule } from 'src/modules/indexing/indexing.module';

interface Experiment {
  name: string;
  chunkSize: number;
  chunkOverlap: number;
}

// topk-3 and topk-10 reuse the baseline index — run evaluate.py directly for those
const EXPERIMENTS: Experiment[] = [
  { name: 'baseline', chunkSize: 2000, chunkOverlap: 250 },
  { name: 'chunk-500', chunkSize: 500, chunkOverlap: 0 },
  { name: 'chunk-1000', chunkSize: 1000, chunkOverlap: 100 },
];

@Injectable()
class OrchestratorService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly indexingService: IndexingService,
  ) {}

  private async truncateVectorStore() {
    await this.dataSource.query('TRUNCATE TABLE knowledge_base');
    console.log('  Truncated knowledge_base');
  }

  private async indexFiles(evalFilesPath: string) {
    const filePaths = JSON.parse(
      fs.readFileSync(evalFilesPath, 'utf-8'),
    ) as string[];
    console.log(`  Indexing ${filePaths.length} files...`);

    let done = 0;
    let failed = 0;

    for (const filePath of filePaths) {
      try {
        const fileId = path.basename(filePath, path.extname(filePath));
        await this.indexingService.indexFile(filePath, fileId, 'experiment');
        done++;
      } catch (err) {
        failed++;
        console.error(
          `\n  Failed: ${path.basename(filePath)} — ${(err as Error).message}`,
        );
      }
      process.stdout.write(
        `\r  Progress: ${done + failed}/${filePaths.length} (${failed} failed)`,
      );
    }

    console.log(`\n  Indexed: ${done}, Failed: ${failed}`);
  }

  async run(evalFilesPath: string, only?: string[]) {
    const experiments = only
      ? EXPERIMENTS.filter((e) => only.includes(e.name))
      : EXPERIMENTS;

    if (experiments.length === 0) {
      console.error(
        `No matching experiments. Available: ${EXPERIMENTS.map((e) => e.name).join(', ')}`,
      );
      return;
    }

    for (const exp of experiments) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`Experiment: ${exp.name}`);
      console.log(
        `  chunkSize=${exp.chunkSize}  chunkOverlap=${exp.chunkOverlap}`,
      );
      console.log('='.repeat(50));

      process.env.CHUNK_SIZE = String(exp.chunkSize);
      process.env.CHUNK_OVERLAP = String(exp.chunkOverlap);

      await this.truncateVectorStore();
      await this.indexFiles(evalFilesPath);

      console.log(`  Indexing complete for "${exp.name}"`);
      console.log(`  → Now run: python evaluate.py --experiment ${exp.name}`);
    }

    console.log(
      '\nAll indexing complete. Run `python plot.py` after all experiments to generate charts.',
    );
  }
}

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AgentModule,
    QueueModule,
    IndexingModule,
  ],
  providers: [OrchestratorService],
})
class AppModule {}

async function bootstrap() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : undefined;
  };

  const evalFiles =
    get('--eval-files') ??
    path.resolve(__dirname, '../common/unity_dataset-files.json');

  const only = get('--only')?.split(',');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const service = app.get(OrchestratorService);
    await service.run(evalFiles, only);
  } finally {
    await app.close();
  }
}

void bootstrap();
