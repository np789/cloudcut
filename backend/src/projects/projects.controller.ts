import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserType } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  create(@CurrentUser() user: CurrentUserType, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(user.id, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserType,
    @Query('workspaceId') workspaceId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.projectsService.findAll(user.id, workspaceId, cursor, limit ? parseInt(limit) : 20);
  }

  @Get(':id')
  findOne(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.projectsService.findOne(id, user.id);
  }

  @Patch(':id')
  update(@CurrentUser() user: CurrentUserType, @Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, user.id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.projectsService.softDelete(id, user.id);
  }

  @Post(':id/duplicate')
  duplicate(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.projectsService.duplicate(id, user.id);
  }
}
