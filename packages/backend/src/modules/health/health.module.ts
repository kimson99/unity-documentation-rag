import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, HttpModule],
})
export class HealthModule {
  static http(): DynamicModule {
    return {
      module: HealthModule,
      controllers: [HealthController],
    };
  }
}
