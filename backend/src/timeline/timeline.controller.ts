import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TimelineService } from './timeline.service';
import {
  CreateTrackDto, UpdateTrackDto,
  CreateClipDto, UpdateClipDto, SplitClipDto, BatchClipOperationDto,
  CreateEffectDto, UpdateEffectDto,
} from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserType } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId')
export class TimelineController {
  constructor(private timelineService: TimelineService) {}

  // Tracks
  @Post('tracks')
  createTrack(@CurrentUser() u: CurrentUserType, @Param('projectId') pid: string, @Body() dto: CreateTrackDto) {
    return this.timelineService.createTrack(pid, u.id, dto);
  }

  @Patch('tracks/:trackId')
  updateTrack(@CurrentUser() u: CurrentUserType, @Param('projectId') pid: string, @Param('trackId') tid: string, @Body() dto: UpdateTrackDto) {
    return this.timelineService.updateTrack(pid, tid, u.id, dto);
  }

  @Delete('tracks/:trackId')
  deleteTrack(@CurrentUser() u: CurrentUserType, @Param('projectId') pid: string, @Param('trackId') tid: string) {
    return this.timelineService.deleteTrack(pid, tid, u.id);
  }

  // Clips
  @Post('clips')
  createClip(@CurrentUser() u: CurrentUserType, @Param('projectId') pid: string, @Body() dto: CreateClipDto) {
    return this.timelineService.createClip(pid, u.id, dto);
  }

  @Patch('clips/:clipId')
  updateClip(@CurrentUser() u: CurrentUserType, @Param('projectId') pid: string, @Param('clipId') cid: string, @Body() dto: UpdateClipDto) {
    return this.timelineService.updateClip(pid, cid, u.id, dto);
  }

  @Delete('clips/:clipId')
  deleteClip(@CurrentUser() u: CurrentUserType, @Param('projectId') pid: string, @Param('clipId') cid: string) {
    return this.timelineService.deleteClip(pid, cid, u.id);
  }

  @Post('clips/:clipId/split')
  splitClip(@CurrentUser() u: CurrentUserType, @Param('projectId') pid: string, @Param('clipId') cid: string, @Body() dto: SplitClipDto) {
    return this.timelineService.splitClip(pid, cid, u.id, dto);
  }

  @Post('clips/batch')
  batchClips(@CurrentUser() u: CurrentUserType, @Param('projectId') pid: string, @Body() dto: BatchClipOperationDto) {
    return this.timelineService.batchOperation(pid, u.id, dto);
  }

  // Effects
  @Post('clips/:clipId/effects')
  createEffect(@CurrentUser() u: CurrentUserType, @Param('projectId') pid: string, @Param('clipId') cid: string, @Body() dto: CreateEffectDto) {
    return this.timelineService.createEffect(pid, cid, u.id, dto);
  }

  @Patch('clips/:clipId/effects/:effectId')
  updateEffect(@CurrentUser() u: CurrentUserType, @Param('projectId') pid: string, @Param('clipId') cid: string, @Param('effectId') eid: string, @Body() dto: UpdateEffectDto) {
    return this.timelineService.updateEffect(pid, cid, eid, u.id, dto);
  }

  @Delete('clips/:clipId/effects/:effectId')
  deleteEffect(@CurrentUser() u: CurrentUserType, @Param('projectId') pid: string, @Param('clipId') cid: string, @Param('effectId') eid: string) {
    return this.timelineService.deleteEffect(pid, cid, eid, u.id);
  }
}
