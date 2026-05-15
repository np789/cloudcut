import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ASSET_PROCESSING_QUEUE } from './queues.module';

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(
    @InjectQueue(ASSET_PROCESSING_QUEUE) private assetQueue: Queue,
  ) {}

  async triggerAssetProcessing(assetId: string, s3Key: string) {
    this.logger.log(`Triggering asset processing for ${assetId}`);

    // Step 1: extract metadata (prerequisite for everything else)
    await this.assetQueue.add(
      'extract-metadata',
      { assetId, s3Key },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        jobId: `metadata-${assetId}`, // Idempotent
      },
    );
  }

  async triggerParallelProcessing(assetId: string, s3Key: string) {
    // These 3 jobs run in parallel after metadata is done
    await Promise.all([
      this.assetQueue.add(
        'generate-proxy',
        { assetId, s3Key },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          jobId: `proxy-${assetId}`,
        },
      ),
      this.assetQueue.add(
        'generate-thumbnails',
        { assetId, s3Key },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          jobId: `thumbnails-${assetId}`,
        },
      ),
      this.assetQueue.add(
        'extract-waveform',
        { assetId, s3Key },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          jobId: `waveform-${assetId}`,
        },
      ),
    ]);
  }
}