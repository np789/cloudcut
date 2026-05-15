import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { OperationLogService } from '../collaboration/operation-log.service';
import {
  CreateTrackDto, UpdateTrackDto,
  CreateClipDto, UpdateClipDto, SplitClipDto, BatchClipOperationDto,
  CreateEffectDto, UpdateEffectDto,
} from './dto';
import { WorkspaceRole } from '@prisma/client';

@Injectable()
export class TimelineService {
  constructor(
    private prisma: PrismaService,
    private workspacesService: WorkspacesService,
    private opLog: OperationLogService,
  ) {}

  private async getProjectAndAuthorize(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) throw new NotFoundException('Project not found');
    await this.workspacesService.requireRole(project.workspaceId, userId, [
      WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR,
    ]);
    return project;
  }

  private async getClipAndAuthorize(clipId: string, userId: string) {
    const clip = await this.prisma.clip.findUnique({
      where: { id: clipId, deletedAt: null },
      include: { project: true },
    });
    if (!clip) throw new NotFoundException('Clip not found');
    await this.workspacesService.requireRole(clip.project.workspaceId, userId, [
      WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR,
    ]);
    return clip;
  }

  async createTrack(projectId: string, userId: string, dto: CreateTrackDto) {
    await this.getProjectAndAuthorize(projectId, userId);
    const track = await this.prisma.track.create({
      data: { projectId, ...dto },
    });
    await this.opLog.logAndBroadcast(projectId, userId, 'track.add', { track });
    return track;
  }

  async updateTrack(projectId: string, trackId: string, userId: string, dto: UpdateTrackDto) {
    await this.getProjectAndAuthorize(projectId, userId);
    const track = await this.prisma.track.update({ where: { id: trackId }, data: dto });
    await this.opLog.logAndBroadcast(projectId, userId, 'track.update', { trackId, changes: dto });
    return track;
  }

  async deleteTrack(projectId: string, trackId: string, userId: string) {
    await this.getProjectAndAuthorize(projectId, userId);
    await this.prisma.clip.updateMany({ where: { trackId }, data: { deletedAt: new Date() } });
    await this.prisma.track.delete({ where: { id: trackId } });
    await this.opLog.logAndBroadcast(projectId, userId, 'track.delete', { trackId });
    return { message: 'Track deleted' };
  }

  async createClip(projectId: string, userId: string, dto: CreateClipDto) {
    await this.getProjectAndAuthorize(projectId, userId);
    const durationMs = dto.outPointMs - dto.inPointMs;
    const clip = await this.prisma.clip.create({
      data: {
        projectId,
        trackId: dto.trackId,
        assetId: dto.assetId,
        trackPositionMs: dto.trackPositionMs,
        inPointMs: dto.inPointMs,
        outPointMs: dto.outPointMs,
        durationMs,
        transform: dto.transform || { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
      },
      include: { effects: true },
    });
    await this.opLog.logAndBroadcast(projectId, userId, 'clip.add', { clip });
    return clip;
  }

  async updateClip(projectId: string, clipId: string, userId: string, dto: UpdateClipDto) {
    const clip = await this.getClipAndAuthorize(clipId, userId);
    const durationMs =
      dto.outPointMs !== undefined && dto.inPointMs !== undefined
        ? dto.outPointMs - dto.inPointMs
        : dto.outPointMs !== undefined
          ? dto.outPointMs - clip.inPointMs
          : dto.inPointMs !== undefined
            ? clip.outPointMs - dto.inPointMs
            : undefined;

    const updated = await this.prisma.clip.update({
      where: { id: clipId },
      data: { ...dto, ...(durationMs !== undefined ? { durationMs } : {}) },
      include: { effects: true },
    });
    await this.opLog.logAndBroadcast(projectId, userId, 'clip.update', { clipId, changes: dto });
    return updated;
  }

  async deleteClip(projectId: string, clipId: string, userId: string) {
    await this.getClipAndAuthorize(clipId, userId);
    await this.prisma.clip.update({ where: { id: clipId }, data: { deletedAt: new Date() } });
    await this.opLog.logAndBroadcast(projectId, userId, 'clip.delete', { clipId });
    return { message: 'Clip deleted' };
  }

  async splitClip(projectId: string, clipId: string, userId: string, dto: SplitClipDto) {
    const clip = await this.getClipAndAuthorize(clipId, userId);
    const splitPointInSource = dto.atTimeMs - clip.trackPositionMs + clip.inPointMs;

    if (splitPointInSource <= clip.inPointMs || splitPointInSource >= clip.outPointMs) {
      throw new ForbiddenException('Split point must be within the clip boundaries');
    }

    const updatedClip = await this.prisma.clip.update({
      where: { id: clipId },
      data: { outPointMs: splitPointInSource, durationMs: splitPointInSource - clip.inPointMs },
    });
    const newClip = await this.prisma.clip.create({
      data: {
        projectId,
        trackId: clip.trackId,
        assetId: clip.assetId,
        trackPositionMs: dto.atTimeMs,
        inPointMs: splitPointInSource,
        outPointMs: clip.outPointMs,
        durationMs: clip.outPointMs - splitPointInSource,
        transform: clip.transform as object,
      },
    });
    await this.opLog.logAndBroadcast(projectId, userId, 'clip.split', { clipId, atTimeMs: dto.atTimeMs, newClipId: newClip.id });
    return { originalClip: updatedClip, newClip };
  }

  async batchOperation(projectId: string, userId: string, dto: BatchClipOperationDto) {
    await this.getProjectAndAuthorize(projectId, userId);
    const result = await this.prisma.$transaction(async (tx) => {
      if (dto.operation === 'delete') {
        await tx.clip.updateMany({ where: { id: { in: dto.clipIds }, projectId }, data: { deletedAt: new Date() } });
        return { deleted: dto.clipIds.length };
      }
      if (dto.operation === 'move' && dto.offsetMs !== undefined) {
        const updates = dto.clipIds.map((id) =>
          tx.clip.update({ where: { id }, data: { trackPositionMs: { increment: dto.offsetMs }, ...(dto.targetTrackId ? { trackId: dto.targetTrackId } : {}) } }),
        );
        return Promise.all(updates);
      }
    });
    await this.opLog.logAndBroadcast(projectId, userId, `clip.batch.${dto.operation}`, dto);
    return result;
  }

  async createEffect(projectId: string, clipId: string, userId: string, dto: CreateEffectDto) {
    await this.getClipAndAuthorize(clipId, userId);
    const effect = await this.prisma.clipEffect.create({ data: { clipId, ...dto, params: dto.params || {} } });
    await this.opLog.logAndBroadcast(projectId, userId, 'effect.add', { clipId, effect });
    return effect;
  }

  async updateEffect(projectId: string, clipId: string, effectId: string, userId: string, dto: UpdateEffectDto) {
    await this.getClipAndAuthorize(clipId, userId);
    const effect = await this.prisma.clipEffect.update({ where: { id: effectId }, data: dto });
    await this.opLog.logAndBroadcast(projectId, userId, 'effect.update', { clipId, effectId, changes: dto });
    return effect;
  }

  async deleteEffect(projectId: string, clipId: string, effectId: string, userId: string) {
    await this.getClipAndAuthorize(clipId, userId);
    await this.prisma.clipEffect.delete({ where: { id: effectId } });
    await this.opLog.logAndBroadcast(projectId, userId, 'effect.delete', { clipId, effectId });
    return { message: 'Effect deleted' };
  }
}
