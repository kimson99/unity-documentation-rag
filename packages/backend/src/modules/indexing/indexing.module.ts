import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentIndexing } from 'src/database/models/document-indexing.model';
import { FileIndexing } from 'src/database/models/file-indexing.model';
import { File } from 'src/database/models/file.model';
import { IndexingController } from './indexing.controller';
import { IndexingProcessor } from './indexing.processor';
import { IndexingService } from './indexing.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'indexing',
      defaultJobOptions: {
        removeOnComplete: {
          age: 60 * 60, // 1 hour
          count: 10,
        },
        removeOnFail: {
          age: 60 * 60, // 1 hour
          count: 10,
        },
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }),
    TypeOrmModule.forFeature([File, DocumentIndexing, FileIndexing]),
  ],
  providers: [IndexingService, IndexingProcessor],
  exports: [IndexingService],
})
export class IndexingModule {
  static http(): DynamicModule {
    return {
      module: IndexingModule,
      controllers: [IndexingController],
    };
  }
}
