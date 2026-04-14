import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from 'src/config/config.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const redisConfig = configService.redisConfig;
        return {
          connection: {
            url: redisConfig.url,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class QueueModule {}
