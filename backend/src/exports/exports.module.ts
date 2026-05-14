import { Module } from '@nestjs/common';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [WorkspacesModule, JobsModule],
  controllers: [ExportsController],
  providers: [ExportsService],
})
export class ExportsModule {}
