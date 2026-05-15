import { Module } from '@nestjs/common';
import { CollaborationController } from './collaboration.controller';
import { PusherService } from './pusher.service';
import { OperationLogService } from './operation-log.service';

@Module({
  controllers: [CollaborationController],
  providers: [PusherService, OperationLogService],
  exports: [PusherService, OperationLogService],
})
export class CollaborationModule {}