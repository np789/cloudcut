import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { QueuesModule } from './queues.module';
import { AssetProcessingProcessor } from './processors/asset-processing.processor';
import { ExportProcessor } from './processors/export.processor';
import { CleanupProcessor } from './processors/cleanup.processor';

@Module({
  imports: [QueuesModule, ScheduleModule.forRoot()],
  providers: [AssetProcessingProcessor, ExportProcessor, CleanupProcessor],
  exports: [QueuesModule],
})
export class JobsModule {}
