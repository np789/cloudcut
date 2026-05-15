import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { FfmpegService } from '../ffmpeg.service';
import { ProgressService } from '../progress.service';
import { EXPORT_QUEUE } from '../queues.module';
import { v4 as uuidv4 } from 'uuid';

@Processor(EXPORT_QUEUE)
export class ExportProcessor extends WorkerHost {
  private readonly logger = new Logger(ExportProcessor.name);

  constructor(
    private prisma: PrismaService,
    private ffmpeg: FfmpegService,
    private progress: ProgressService,
  ) {
    super();
  }

  async process(job: Job<{ exportJobId: string; projectId: string }>) {
    const { exportJobId, projectId } = job.data;
    this.logger.log(`Starting export job ${exportJobId}`);

    try {
      // ── Step 1: Mark as processing ──────────────────
      await this.progress.updateExportProgress(exportJobId, 0, 'PROCESSING');
      await job.updateProgress(5);

      // ── Step 2: Load all timeline data ──────────────
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: {
          tracks: {
            where: { type: 'VIDEO' },
            orderBy: { orderIndex: 'asc' },
            include: {
              clips: {
                where: { deletedAt: null },
                orderBy: { trackPositionMs: 'asc' },
                include: {
                  asset: { include: { variants: true } },
                  effects: { where: { enabled: true }, orderBy: { orderIndex: 'asc' } },
                },
              },
            },
          },
        },
      });

      if (!project) throw new Error('Project not found');

      // Collect all clips from the first video track
      const videoTrack = project.tracks[0];
      if (!videoTrack || videoTrack.clips.length === 0) {
        throw new Error('No video clips found in project');
      }

      await this.progress.updateExportProgress(exportJobId, 10);
      await job.updateProgress(10);

      // ── Step 3: Download and trim each clip ─────────
      const clips = videoTrack.clips;
      const segments: Buffer[] = [];

      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        const progressPct = 10 + Math.floor((i / clips.length) * 60);

        await this.progress.updateExportProgress(exportJobId, progressPct);
        await job.updateProgress(progressPct);

        this.logger.log(`Processing clip ${i + 1}/${clips.length}: ${clip.id}`);

        // Download the source asset
        const s3Key = clip.asset.originalUrl;
        const assetBuffer = await this.ffmpeg.downloadFromS3(s3Key);

        // Trim to in/out points
        const trimmed = await this.ffmpeg.trimClip(
          assetBuffer,
          clip.inPointMs,
          clip.outPointMs,
        );

        segments.push(trimmed);
      }

      // ── Step 4: Concatenate all segments ────────────
      await this.progress.updateExportProgress(exportJobId, 75);
      await job.updateProgress(75);

      this.logger.log(`Concatenating ${segments.length} segments...`);
      const finalVideo = segments.length === 1
        ? segments[0]
        : await this.ffmpeg.concatenateSegments(segments);

      // ── Step 5: Upload to S3 ─────────────────────────
      await this.progress.updateExportProgress(exportJobId, 90, 'UPLOADING');
      await job.updateProgress(90);

      const outputKey = `exports/${exportJobId}/output.mp4`;
      const outputUrl = await this.ffmpeg.uploadToS3(outputKey, finalVideo, 'video/mp4');

      // ── Step 6: Mark complete ────────────────────────
      await this.prisma.exportJob.update({
        where: { id: exportJobId },
        data: {
          status: 'COMPLETED',
          outputUrl,
          outputFileSize: BigInt(finalVideo.length),
          completedAt: new Date(),
          progressPercent: 100,
        },
      });

      await job.updateProgress(100);
      this.logger.log(`Export ${exportJobId} completed: ${outputUrl}`);
      return { outputUrl };

    } catch (error) {
      this.logger.error(`Export ${exportJobId} failed:`, error);
      await this.prisma.exportJob.update({
        where: { id: exportJobId },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error; // Re-throw for BullMQ retry
    }
  }
}