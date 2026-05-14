import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { GetPresignedUrlDto, ConfirmUploadDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserType } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('assets')
export class AssetsController {
  constructor(private assetsService: AssetsService) {}

  @Post('presigned-url')
  getPresignedUrl(@CurrentUser() user: CurrentUserType, @Body() dto: GetPresignedUrlDto) {
    return this.assetsService.getPresignedUrl(user.id, dto);
  }

  @Post('confirm-upload')
  confirmUpload(@CurrentUser() user: CurrentUserType, @Body() dto: ConfirmUploadDto) {
    return this.assetsService.confirmUpload(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: CurrentUserType, @Query('projectId') projectId: string) {
    return this.assetsService.findAll(user.id, projectId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.assetsService.findOne(id, user.id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.assetsService.softDelete(id, user.id);
  }
}
