import { Module, RequestMethod } from '@nestjs/common';

import { Request, Response } from 'express';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { HealthModule } from './modules/health/health.module';
import { RoleModule } from './modules/role/role.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    AuthModule.http(),
    ConfigModule,
    DatabaseModule,
    LoggerModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const isDev = configService.isDev;
        return {
          pinoHttp: {
            level: isDev ? 'debug' : 'info',
            transport: isDev
              ? { target: 'pino-pretty', options: { singleLine: true } }
              : undefined,
            serializers: {
              req: (req: Request) => ({
                method: req.method,
                url: req.url,
              }),
              res: (res: Response) => ({
                statusCode: res.statusCode,
              }),
            },
          },
          exclude: [{ method: RequestMethod.ALL, path: 'health' }],
        };
      },
      inject: [ConfigService],
    }),
    RoleModule,
    HealthModule.http(),
    UserModule.http(),
    ChatModule.http(),
  ],
})
export class AppModule {}
