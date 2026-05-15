import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { FfmpegService } from '../ffmpeg.service';
import { OrchestratorService } from '../orchestrator.service';
import { ASSET_PROCESSING_QUEUE } from '../queues.module';
import { v4 as uuidv4 } from 'uuid';

@Processor(ASSET_PROCESSING_QUEUE)
export class AssetProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(AssetProcessingProcessor.name);

  constructor(
    private prisma: PrismaService,
    private ffmpeg: FfmpegService,
    private orchestrator: OrchestratorService,
  ) {
    super();
  }

  async process(job: Job) {
    this.logger.log(`Processing job: ${job.name} (${job.id})`);

    switch (job.name) {
      case 'extract-metadata':
        return this.handleExtractMetadata(job);
      case 'generate-proxy':
        return this.handleGenerateProxy(job);
      case 'generate-thumbnails':
        return this.handleGenerateThumbnails(job);
      case 'extract-waveform':
        return this.handleExtractWaveform(job);
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  }

  // ── Extract Metadata ──────────────────────────────────
  private async handleExtractMetadata(job: Job<{ assetId: string; s3Key: string }>) {
    const { assetId, s3Key } = job.data;

    await job.updateProgress(10);
    const inputBuffer = await this.ffmpeg.downloadFromS3(s3Key);

    await job.updateProgress(30);
    const metadata = await this.ffmpeg.extractMetadata(inputBuffer);

    await job.updateProgress(80);
    await this.prisma.asset.update({
      where: { id: assetId },
      data: { metadata, status: 'PROCESSING' },
    });

    // Trigger the 3 parallel processing jobs now that we have metadata
    await this.orchestrator.triggerParallelProcessing(assetId, s3Key);

    await job.updateProgress(100);
    this.logger.log(`Metadata extracted for asset ${assetId}`);
    return metadata;
  }

  // ── Generate Proxy ────────────────────────────────────
  private async handleGenerateProxy(job: Job<{ assetId: string; s3Key: string }>) {
    const { assetId, s3Key } = job.data;

    await job.updateProgress(10);
    const inputBuffer = await this.ffmpeg.downloadFromS3(s3Key);

    await job.updateProgress(20);
    const proxyBuffer = await this.ffmpeg.generateProxy(inputBuffer);

    await job.updateProgress(80);
    const proxyKey = `proxies/${assetId}/proxy_720p.mp4`;
    const proxyUrl = await this.ffmpeg.uploadToS3(proxyKey, proxyBuffer, 'video/mp4');

    await this.prisma.assetVariant.create({
      data: {
        assetId,
        type: 'PROXY',
        url: proxyUrl,
        metadata: { resolution: '720p', key: proxyKey },
      },
    });

    await job.updateProgress(100);
    await this.checkAndMarkReady(assetId);
    this.logger.log(`Proxy generated for asset ${assetId}`);
    return { proxyUrl };
  }

  // ── Generate Thumbnails ───────────────────────────────
  private async handleGenerateThumbnails(job: Job<{ assetId: string; s3Key: string }>) {
    const { assetId, s3Key } = job.data;

    await job.updateProgress(10);
    const inputBuffer = await this.ffmpeg.downloadFromS3(s3Key);

    const asset = await this.prisma.asset.findUnique({ where: { id: assetId } });
    const durationMs = (asset?.metadata as any)?.durationMs || 30000;

    await job.updateProgress(20);
    const thumbnails = await this.ffmpeg.generateThumbnails(inputBuffer, durationMs);

    await job.updateProgress(60);
    // Upload thumbnails as individual files
    const thumbnailUrls: string[] = [];
    for (let i = 0; i < thumbnails.length; i++) {
      const key = `thumbnails/${assetId}/thumb_${i}.jpg`;
      const url = await this.ffmpeg.uploadToS3(key, thumbnails[i], 'image/jpeg');
      thumbnailUrls.push(url);
    }

    await this.prisma.assetVariant.create({
      data: {
        assetId,
        type: 'THUMBNAIL_STRIP',
        url: thumbnailUrls[0] || '',
        metadata: { thumbnails: thumbnailUrls, count: thumbnails.length },
      },
    });

    await job.updateProgress(100);
    await this.checkAndMarkReady(assetId);
    this.logger.log(`${thumbnails.length} thumbnails generated for asset ${assetId}`);
    return { count: thumbnails.length };
  }

  // ── Extract Waveform ──────────────────────────────────
  private async handleExtractWaveform(job: Job<{ assetId: string; s3Key: string }>) {
    const { assetId, s3Key } = job.data;

    await job.updateProgress(10);
    const inputBuffer = await this.ffmpeg.downloadFromS3(s3Key);

    await job.updateProgress(30);
    const peaks = await this.ffmpeg.extractWaveform(inputBuffer);

    await job.updateProgress(80);
    // Store peaks as JSON in S3
    const peaksKey = `waveforms/${assetId}/peaks.json`;
    const peaksBuffer = Buffer.from(JSON.stringify(peaks));
    const peaksUrl = await this.ffmpeg.uploadToS3(peaksKey, peaksBuffer, 'application/json');

    await this.prisma.assetVariant.create({
      data: {
        assetId,
        type: 'WAVEFORM_DATA',
        url: peaksUrl,
        metadata: { peaksCount: peaks.length },
      },
    });

    await job.updateProgress(100);
    await this.checkAndMarkReady(assetId);
    this.logger.log(`Waveform extracted for asset ${assetId}`);
    return { peaksCount: peaks.length };
  }

  // ── Mark asset READY when all 3 variants exist ────────
  private async checkAndMarkReady(assetId: string) {
    const variants = await this.prisma.assetVariant.findMany({
      where: { assetId },
    });
    const hasProxy = variants.some((v) => v.type === 'PROXY');
    const hasThumbs = variants.some((v) => v.type === 'THUMBNAIL_STRIP');
    const hasWaveform = variants.some((v) => v.type === 'WAVEFORM_DATA');

    if (hasProxy && hasThumbs && hasWaveform) {
      await this.prisma.asset.update({
        where: { id: assetId },
        data: { status: 'READY' },
      });
      this.logger.log(`Asset ${assetId} is now READY`);
    }
  }
}