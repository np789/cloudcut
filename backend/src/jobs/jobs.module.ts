import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { QueuesModule } from './queues.module';
import { FfmpegService } from './ffmpeg.service';
import { OrchestratorService } from './orchestrator.service';
import { ProgressService } from './progress.service';
import { AssetProcessingProcessor } from './processors/asset-processing.processor';
import { ExportProcessor } from './processors/export.processor';
import { CleanupProcessor } from './processors/cleanup.processor';

@Module({
  imports: [QueuesModule, ScheduleModule.forRoot()],
  providers: [
    FfmpegService,
    OrchestratorService,
    ProgressService,
    AssetProcessingProcessor,
    ExportProcessor,
    CleanupProcessor,
  ],
  exports: [QueuesModule, FfmpegService, OrchestratorService, ProgressService],
})
export class JobsModule {}