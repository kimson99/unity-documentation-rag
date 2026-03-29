import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestJsConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';

@Global()
@Module({
  imports: [
    NestJsConfigModule.forRoot({
      envFilePath: [
        ...['local', 'development', 'production'].map((val) => `.env.${val}`),
        '.env',
      ],
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
