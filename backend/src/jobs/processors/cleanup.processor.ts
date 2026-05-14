import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class CleanupProcessor {
  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runCleanup() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const deletedProjects = await this.prisma.project.deleteMany({
      where: { deletedAt: { lt: thirtyDaysAgo } },
    });

    console.log(`[Cleanup] Deleted ${deletedProjects.count} expired projects`);
  }
}
