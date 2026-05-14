import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto, InviteMemberDto, UpdateMemberRoleDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserType } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  @Post()
  create(@CurrentUser() user: CurrentUserType, @Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: CurrentUserType) {
    return this.workspacesService.findAll(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.workspacesService.findOne(id, user.id);
  }

  @Post(':id/invite')
  invite(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.workspacesService.invite(id, user.id, dto);
  }

  @Patch(':id/members/:userId')
  updateRole(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.workspacesService.updateMemberRole(id, user.id, userId, dto);
  }

  @Delete(':id/members/:userId')
  removeMember(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.workspacesService.removeMember(id, user.id, userId);
  }
}
