import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ExportsService } from './exports.service';
import { CreateExportDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserType } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class ExportsController {
  constructor(private exportsService: ExportsService) {}

  @Post('projects/:projectId/exports')
  create(@CurrentUser() u: CurrentUserType, @Param('projectId') pid: string, @Body() dto: CreateExportDto) {
    return this.exportsService.createExport(pid, u.id, dto);
  }

  @Get('projects/:projectId/exports')
  findAll(@CurrentUser() u: CurrentUserType, @Param('projectId') pid: string) {
    return this.exportsService.findAll(pid, u.id);
  }

  @Get('exports/:id')
  findOne(@CurrentUser() u: CurrentUserType, @Param('id') id: string) {
    return this.exportsService.findOne(id, u.id);
  }

  @Delete('exports/:id')
  cancel(@CurrentUser() u: CurrentUserType, @Param('id') id: string) {
    return this.exportsService.cancel(id, u.id);
  }
}
