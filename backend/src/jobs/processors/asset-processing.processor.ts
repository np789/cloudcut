import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ASSET_PROCESSING_QUEUE } from '../queues.module';

@Processor(ASSET_PROCESSING_QUEUE)
export class AssetProcessingProcessor extends WorkerHost {
  async process(job: Job) {
    console.log(`[AssetProcessing] Processing job ${job.id}, type: ${job.name}`);
    // Day 3: real ffmpeg.wasm processing goes here
    return { status: 'placeholder' };
  }
}
