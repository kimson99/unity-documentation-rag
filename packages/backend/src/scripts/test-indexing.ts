import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import path from 'path';
import { ConfigModule } from 'src/config/config.module';
import { DatabaseModule } from 'src/database/database.module';
import { IndexingModule } from 'src/modules/indexing/indexing.module';
import { IndexingService } from 'src/modules/indexing/indexing.service';

@Module({
  imports: [ConfigModule, DatabaseModule, IndexingModule],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = await app.get(IndexingService);
  await service.testIndexing(path.resolve(__dirname, '../UnityManual.html'));
  await app.close();
}
bootstrap();
