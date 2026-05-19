import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { OrchestratorService } from '../jobs/orchestrator.service';
import { GetPresignedUrlDto, ConfirmUploadDto } from './dto';
import { WorkspaceRole } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AssetsService {
  private s3: S3Client;
  private bucket: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private workspacesService: WorkspacesService,
    private orchestrator: OrchestratorService,
  ) {
    this.s3 = new S3Client({
      region: config.get<string>('aws.region') || 'us-east-1',
      credentials: {
        accessKeyId: config.get<string>('aws.accessKeyId') || '',
        secretAccessKey: config.get<string>('aws.secretAccessKey') || '',
      },
    });
    this.bucket = config.get<string>('aws.bucket') || '';
  }

  async getPresignedUrl(userId: string, dto: GetPresignedUrlDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId, deletedAt: null },
    });
    if (!project) throw new NotFoundException('Project not found');
    await this.workspacesService.requireRole(project.workspaceId, userId, [
      WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR,
    ]);

    const key = `projects/${dto.projectId}/assets/${uuidv4()}-${dto.filename}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: dto.contentType,
    });

    const url = await getSignedUrl(this.s3, command, { expiresIn: 900 });
    return { uploadUrl: url, key };
  }

  async confirmUpload(userId: string, dto: ConfirmUploadDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId, deletedAt: null },
    });
    if (!project) throw new NotFoundException('Project not found');

    const filename = dto.filename || dto.originalUrl.split('/').pop() || 'unknown';

    const asset = await this.prisma.asset.create({
      data: {
        projectId: dto.projectId,
        uploadedById: userId,
        type: dto.type,
        originalUrl: dto.originalUrl,
        status: 'READY',
        metadata: {
          filename,
          durationMs: dto.durationMs || 0,
          fileSizeBytes: 0,
        },
      },
    });

    await this.orchestrator.triggerAssetProcessing(asset.id, dto.originalUrl);
    return asset;
  }

  async findAll(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) throw new NotFoundException('Project not found');
    await this.workspacesService.requireMember(project.workspaceId, userId);
    return this.prisma.asset.findMany({
      where: { projectId, deletedAt: null },
      include: { variants: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(assetId: string, userId: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId, deletedAt: null },
      include: { variants: true, project: true },
    });
    if (!asset) throw new NotFoundException('Asset not found');
    await this.workspacesService.requireMember(asset.project.workspaceId, userId);
    return asset;
  }

  async softDelete(assetId: string, userId: string) {
    const asset = await this.findOne(assetId, userId);
    return this.prisma.asset.update({
      where: { id: asset.id },
      data: { deletedAt: new Date() },
    });
  }
}