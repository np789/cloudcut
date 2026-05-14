import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { ProjectsModule } from './projects/projects.module';
import { AssetsModule } from './assets/assets.module';
import { TimelineModule } from './timeline/timeline.module';
import { ExportsModule } from './exports/exports.module';
import { JobsModule } from './jobs/jobs.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    WorkspacesModule,
    ProjectsModule,
    AssetsModule,
    TimelineModule,
    ExportsModule,
    JobsModule,
  ],
})
export class AppModule {}
