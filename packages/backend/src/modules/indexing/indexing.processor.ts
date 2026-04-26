import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { IndexingService } from './indexing.service';

interface IndexingJobData {
  fileId: string;
  fileKey: string;
  documentIndexingId: string;
}

@Processor('indexing')
export class IndexingProcessor extends WorkerHost {
  private logger = new Logger(IndexingProcessor.name);

  constructor(private readonly indexingService: IndexingService) {
    super();
  }

  public async process(job: Job<IndexingJobData, void, string>) {
    this.logger.log('Processing job id %s: %o', job.id, job.data);
    await this.indexingService.indexFile(
      job.data.fileKey,
      job.data.fileId,
      job.data.documentIndexingId,
    );
  }

  @OnWorkerEvent('completed')
  public async onCompleted(job: Job<IndexingJobData, void, string>) {
    await this.indexingService.markFileIndexingComplete({
      fileId: job.data.fileId,
      documentIndexingId: job.data.documentIndexingId,
      status: 'completed',
    });
    this.logger.log('Job id %s completed', job.id);
  }

  @OnWorkerEvent('failed')
  public async onFailed(job: Job<IndexingJobData, void, string>, error: Error) {
    await this.indexingService.markFileIndexingComplete({
      fileId: job.data.fileId,
      documentIndexingId: job.data.documentIndexingId,
      status: 'failed',
      error: JSON.stringify(error),
    });
    this.logger.error(
      'Job id %s failed: %s',
      job.id,
      error?.message ?? JSON.stringify(error),
      error?.stack,
    );
  }
}
