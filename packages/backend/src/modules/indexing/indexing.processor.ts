import { Processor } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('indexing')
export class IndexingProcessor {
  private logger = new Logger(IndexingProcessor.name);

  public async process(job: Job<any, any, string>) {
    this.logger.log('Processing job:', job.id, 'with data:', job.data);
  }
}
