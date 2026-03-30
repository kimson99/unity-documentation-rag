import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import path from 'path';
import { ConfigService } from 'src/config/config.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const pg = configService.pg;
        return {
          url: pg.url,
          type: 'postgres',
          entities: [path.resolve(__dirname, 'models', '*.model.{ts,js}')],
          migrations: [
            path.resolve(__dirname, 'migrations', '*.model.{ts,js}'),
          ],
          synchronize: true,
          autoLoadEntities: true,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
