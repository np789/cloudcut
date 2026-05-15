import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PusherService } from './pusher.service';

@Injectable()
export class OperationLogService {
  constructor(
    private prisma: PrismaService,
    private pusher: PusherService,
  ) {}

  // Call this after every mutation (clip move, trim, effect change, etc.)
  async logAndBroadcast(
    projectId: string,
    userId: string,
    operationType: string,
    payload: object,
    clientSeq: number = 0,
  ) {
    // 1. Write to OperationLog for history and reconnect sync
    const log = await this.prisma.operationLog.create({
      data: {
        projectId,
        userId,
        operationType,
        payload,
        clientSeq,
      },
    });

    // 2. Broadcast to all other clients in the project channel
    await this.pusher.triggerProjectEvent(projectId, 'operation', {
      id: log.id,
      type: operationType,
      payload,
      userId,
      seq: log.clientSeq,
    });

    return log;
  }

  // Get operations since a given sequence number (for reconnect sync)
  async getOperationsSince(projectId: string, since: Date) {
    return this.prisma.operationLog.findMany({
      where: { projectId, createdAt: { gt: since } },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }
}