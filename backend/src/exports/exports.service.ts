import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateExportDto } from './dto';
import { WorkspaceRole } from '@prisma/client';
import { EXPORT_QUEUE } from '../jobs/queues.module';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ExportsService {
  constructor(
    private prisma: PrismaService,
    private workspacesService: WorkspacesService,
    @InjectQueue(EXPORT_QUEUE) private exportQueue: Queue,
  ) {}

  async createExport(projectId: string, userId: string, dto: CreateExportDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) throw new NotFoundException('Project not found');
    await this.workspacesService.requireRole(project.workspaceId, userId, [
      WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR,
    ]);

    const idempotencyKey = dto.idempotencyKey || uuidv4();

    const existing = await this.prisma.exportJob.findUnique({
      where: { idempotencyKey },
    });
    if (existing) return existing; // Idempotent — return existing job

    const exportJob = await this.prisma.exportJob.create({
      data: {
        projectId,
        requestedById: userId,
        format: dto.format || 'MP4',
        resolution: dto.resolution || '1080p',
        quality: dto.quality || 'STANDARD',
        idempotencyKey,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    await this.exportQueue.add('render-export', { exportJobId: exportJob.id, projectId }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });

    return exportJob;
  }

  async findAll(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) throw new NotFoundException('Project not found');
    await this.workspacesService.requireMember(project.workspaceId, userId);

    return this.prisma.exportJob.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(exportJobId: string, userId: string) {
    const job = await this.prisma.exportJob.findUnique({
      where: { id: exportJobId },
      include: { project: true },
    });
    if (!job) throw new NotFoundException('Export job not found');
    await this.workspacesService.requireMember(job.project.workspaceId, userId);
    return job;
  }

  async cancel(exportJobId: string, userId: string) {
    const job = await this.findOne(exportJobId, userId);
    if (!['QUEUED', 'PROCESSING'].includes(job.status)) {
      throw new ConflictException('Can only cancel queued or processing jobs');
    }

    return this.prisma.exportJob.update({
      where: { id: exportJobId },
      data: { status: 'CANCELLED' },
    });
  }
}
