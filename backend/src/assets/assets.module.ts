import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [WorkspacesModule, JobsModule],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}