import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const ASSET_PROCESSING_QUEUE = 'asset-processing';
export const EXPORT_QUEUE = 'export';
export const CLEANUP_QUEUE = 'cleanup';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: ASSET_PROCESSING_QUEUE },
      { name: EXPORT_QUEUE },
      { name: CLEANUP_QUEUE },
    ),
  ],
  exports: [BullModule],
})
export class QueuesModule {}
