import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { IndexingService } from './indexing.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'indexing' })],
  providers: [IndexingService],
  exports: [IndexingService],
})
export class IndexingModule {}
