import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EXPORT_QUEUE } from '../queues.module';

@Processor(EXPORT_QUEUE)
export class ExportProcessor extends WorkerHost {
  async process(job: Job) {
    console.log(`[Export] Processing export job ${job.id}`);
    // Day 3: real export pipeline goes here
    return { status: 'placeholder' };
  }
}
