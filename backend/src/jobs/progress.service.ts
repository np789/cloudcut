import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(private prisma: PrismaService) {}

  async updateExportProgress(exportJobId: string, percent: number, status?: string) {
    this.logger.log(`Export ${exportJobId}: ${percent}%`);
    await this.prisma.exportJob.update({
      where: { id: exportJobId },
      data: {
        progressPercent: percent,
        ...(status ? { status: status as any } : {}),
        ...(status === 'PROCESSING' && percent === 0 ? { startedAt: new Date() } : {}),
        ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
      },
    });
    // Day 4: Pusher broadcast goes here
  }
}