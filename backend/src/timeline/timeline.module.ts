import { Module } from '@nestjs/common';
import { TimelineController } from './timeline.controller';
import { TimelineService } from './timeline.service';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { CollaborationModule } from '../collaboration/collaboration.module';

@Module({
  imports: [WorkspacesModule, CollaborationModule],
  controllers: [TimelineController],
  providers: [TimelineService],
  exports: [TimelineService],
})
export class TimelineModule {}