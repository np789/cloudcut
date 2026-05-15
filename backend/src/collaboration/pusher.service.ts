import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Pusher from 'pusher';

@Injectable()
export class PusherService {
  private readonly logger = new Logger(PusherService.name);
  private client: any;

  constructor(private config: ConfigService) {
    const PusherClient = (Pusher as any).default || Pusher;
    this.client = new PusherClient({
      appId: config.get<string>('pusher.appId') || '',
      key: config.get<string>('pusher.key') || '',
      secret: config.get<string>('pusher.secret') || '',
      cluster: config.get<string>('pusher.cluster') || 'us2',
      useTLS: true,
    });
  }

  async triggerProjectEvent(
    projectId: string,
    event: string,
    data: object,
  ): Promise<void> {
    try {
      await this.client.trigger(`private-project-${projectId}`, event, data);
    } catch (err) {
      this.logger.error(`Pusher trigger failed: ${err}`);
    }
  }

  async triggerUserEvent(
    userId: string,
    event: string,
    data: object,
  ): Promise<void> {
    try {
      await this.client.trigger(`private-user-${userId}`, event, data);
    } catch (err) {
      this.logger.error(`Pusher trigger failed: ${err}`);
    }
  }

  authenticateChannel(socketId: string, channel: string, userId: string, userInfo: object) {
    if (channel.startsWith('presence-')) {
      return this.client.authorizeChannel(socketId, channel, {
        user_id: userId,
        user_info: userInfo,
      });
    }
    return this.client.authorizeChannel(socketId, channel);
  }
}