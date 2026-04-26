import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigModule } from 'src/config/config.module';
import { DatabaseModule } from 'src/database/database.module';
import { File } from 'src/database/models/file.model';
import { QueueModule } from 'src/database/queue.module';
import { IndexingModule } from 'src/modules/indexing/indexing.module';
import { IndexingService } from 'src/modules/indexing/indexing.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
class TestService {
  constructor(
    @InjectRepository(File) private fileRepo: Repository<File>,
    private indexingService: IndexingService,
  ) {}

  async run(filePath: string) {
    const resolvedPath = path.resolve(filePath);
    const file = await this.fileRepo.save(
      this.fileRepo.create({
        filename: path.basename(resolvedPath),
        size: fs.statSync(resolvedPath).size,
        mimetype: 'text/html',
        key: resolvedPath,
      }),
    );
    await this.indexingService.indexFile(resolvedPath, file.id, 'test-run');
    console.log('Done indexing', resolvedPath);
  }
}

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    QueueModule,
    IndexingModule,
    TypeOrmModule.forFeature([File]),
  ],
  providers: [TestService],
})
class AppModule {}

async function bootstrap() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: pnpm ts src/scripts/test-indexing.ts <file-path>');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const service = app.get(TestService);
    await service.run(filePath);
  } finally {
    await app.close();
  }
}

void bootstrap();
