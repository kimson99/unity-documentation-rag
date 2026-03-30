import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import path from 'path';
import { generateApi } from 'swagger-typescript-api';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  // Logger
  app.useLogger(app.get(Logger));

  // Settings
  app.setGlobalPrefix('api');
  app.enableCors({ credentials: true, origin: true });

  // Docs
  const config = new DocumentBuilder()
    .setTitle('Unity Documentation RAG API')
    .setDescription('API documentation for Unity Documentation RAG')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api', app, document);

  // SDK
  if (process.env.NODE_ENV === 'local') {
    const docPath = path.resolve(__dirname, '../../docs/');
    if (!existsSync(docPath)) {
      mkdirSync(docPath, { recursive: true });
    }
    writeFileSync(
      path.resolve(docPath, 'api-spec.json'),
      JSON.stringify(document, null, 2),
    );

    await generateApi({
      fileName: 'sdk.ts',
      output: path.resolve(__dirname, '../../frontend/src/api'),
      spec: document as any,
      httpClientType: 'axios',
    });
  }

  // Validation
  app.useGlobalPipes(new ValidationPipe());

  // Security
  app.use(helmet());

  await app.listen(process.env.PORT ?? 5500);
}
bootstrap().catch((err) => {
  console.error('Failed to start application', err);
  process.exit(1);
});
