import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserType } from '../common/decorators/current-user.decorator';
import { PusherService } from './pusher.service';
import { IsString } from 'class-validator';

class PusherAuthDto {
  @IsString()
  socket_id!: string;

  @IsString()
  channel_name!: string;
}

@Controller('pusher')
export class CollaborationController {
  constructor(private pusherService: PusherService) {}

  // Pusher calls this endpoint to authenticate the client for private/presence channels
  @UseGuards(JwtAuthGuard)
  @Post('auth')
  authenticate(
    @CurrentUser() user: CurrentUserType,
    @Body() body: PusherAuthDto,
  ) {
    return this.pusherService.authenticateChannel(
      body.socket_id,
      body.channel_name,
      user.id,
      { name: user.name, avatarUrl: user.avatarUrl },
    );
  }
}