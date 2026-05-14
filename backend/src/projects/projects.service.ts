import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { WorkspaceRole } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private workspacesService: WorkspacesService,
  ) {}

  async create(userId: string, dto: CreateProjectDto) {
    await this.workspacesService.requireRole(dto.workspaceId, userId, [
      WorkspaceRole.OWNER,
      WorkspaceRole.ADMIN,
      WorkspaceRole.EDITOR,
    ]);

    return this.prisma.project.create({
      data: {
        workspaceId: dto.workspaceId,
        name: dto.name,
        description: dto.description,
        settings: dto.settings || { resolution: '1080p', fps: 30, aspectRatio: '16:9' },
        createdById: userId,
      },
    });
  }

  async findAll(userId: string, workspaceId: string, cursor?: string, limit = 20) {
    await this.workspacesService.requireMember(workspaceId, userId);

    const take = Math.min(limit, 50) + 1;
    const projects = await this.prisma.project.findMany({
      where: { workspaceId, deletedAt: null },
      take,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { clips: true, assets: true } },
      },
    });

    const hasNextPage = projects.length > limit;
    const data = hasNextPage ? projects.slice(0, limit) : projects;

    return {
      data,
      nextCursor: hasNextPage ? data[data.length - 1].id : null,
    };
  }

  async findOne(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
      include: {
        tracks: {
          orderBy: { orderIndex: 'asc' },
          include: {
            clips: {
              where: { deletedAt: null },
              orderBy: { trackPositionMs: 'asc' },
              include: { effects: { orderBy: { orderIndex: 'asc' } } },
            },
          },
        },
        textOverlays: true,
        assets: {
          where: { deletedAt: null },
          include: { variants: true },
        },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    await this.workspacesService.requireMember(project.workspaceId, userId);
    return project;
  }

  async update(projectId: string, userId: string, dto: UpdateProjectDto) {
    const project = await this.getAndAuthorize(projectId, userId, 'editor');
    return this.prisma.project.update({
      where: { id: projectId },
      data: dto,
    });
  }

  async softDelete(projectId: string, userId: string) {
    await this.getAndAuthorize(projectId, userId, 'editor');
    return this.prisma.project.update({
      where: { id: projectId },
      data: { deletedAt: new Date() },
    });
  }

  async duplicate(projectId: string, userId: string) {
    const original = await this.findOne(projectId, userId);

    const copy = await this.prisma.project.create({
      data: {
        workspaceId: original.workspaceId,
        name: `${original.name} (Copy)`,
        description: original.description,
        settings: original.settings as object,
        createdById: userId,
      },
    });

    // Copy tracks and clips
    for (const track of original.tracks) {
      const newTrack = await this.prisma.track.create({
        data: {
          projectId: copy.id,
          type: track.type,
          label: track.label,
          orderIndex: track.orderIndex,
          color: track.color,
        },
      });

      for (const clip of track.clips) {
        const newClip = await this.prisma.clip.create({
          data: {
            trackId: newTrack.id,
            projectId: copy.id,
            assetId: clip.assetId,
            trackPositionMs: clip.trackPositionMs,
            inPointMs: clip.inPointMs,
            outPointMs: clip.outPointMs,
            durationMs: clip.durationMs,
            transform: clip.transform as object,
          },
        });

        for (const effect of clip.effects) {
          await this.prisma.clipEffect.create({
            data: {
              clipId: newClip.id,
              type: effect.type,
              orderIndex: effect.orderIndex,
              params: effect.params as object,
              enabled: effect.enabled,
            },
          });
        }
      }
    }

    return copy;
  }

  private async getAndAuthorize(projectId: string, userId: string, _level: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) throw new NotFoundException('Project not found');

    await this.workspacesService.requireRole(project.workspaceId, userId, [
      WorkspaceRole.OWNER,
      WorkspaceRole.ADMIN,
      WorkspaceRole.EDITOR,
    ]);

    return project;
  }
}
