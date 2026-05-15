import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Injectable()
export class FfmpegService {
  private readonly logger = new Logger(FfmpegService.name);
  private s3: S3Client;
  private bucket: string;

  constructor(private config: ConfigService) {
    this.s3 = new S3Client({
      region: config.get<string>('aws.region') || 'us-east-1',
      credentials: {
        accessKeyId: config.get<string>('aws.accessKeyId') || '',
        secretAccessKey: config.get<string>('aws.secretAccessKey') || '',
      },
    });
    this.bucket = config.get<string>('aws.bucket') || '';
  }

  async downloadFromS3(key: string): Promise<Buffer> {
    this.logger.log(`Downloading from S3: ${key}`);
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    const response = await this.s3.send(command);
    const stream = response.Body as Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async uploadToS3(key: string, buffer: Buffer, contentType: string): Promise<string> {
    this.logger.log(`Uploading to S3: ${key}`);
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  async extractMetadata(inputBuffer: Buffer): Promise<object> {
    this.logger.log('Extracting metadata (stub)');
    return {
      durationMs: 30000,
      width: 1920,
      height: 1080,
      codec: 'h264',
      audioCodec: 'aac',
      fileSizeBytes: inputBuffer.length,
    };
  }

  async generateProxy(inputBuffer: Buffer): Promise<Buffer> {
    this.logger.log('Generating proxy (stub)');
    return inputBuffer;
  }

  async generateThumbnails(inputBuffer: Buffer, durationMs: number): Promise<Buffer[]> {
    this.logger.log('Generating thumbnails (stub)');
    return [inputBuffer];
  }

  async extractWaveform(inputBuffer: Buffer): Promise<number[]> {
    this.logger.log('Extracting waveform (stub)');
    return Array.from({ length: 1000 }, () => Math.random());
  }

  async trimClip(inputBuffer: Buffer, inPointMs: number, outPointMs: number): Promise<Buffer> {
    this.logger.log(`Trimming clip ${inPointMs}-${outPointMs}ms (stub)`);
    return inputBuffer;
  }

  async concatenateSegments(segments: Buffer[]): Promise<Buffer> {
    this.logger.log(`Concatenating ${segments.length} segments (stub)`);
    return segments[0];
  }
}