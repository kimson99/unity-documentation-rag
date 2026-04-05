import { Module } from '@nestjs/common';
import { IndexingModule } from '../indexing/indexing.module';
import { AgentService } from './agent.service';

@Module({
  imports: [IndexingModule],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
