import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class CleanupProcessor {
  private readonly logger = new Logger(CleanupProcessor.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runCleanup() {
    this.logger.log('Starting daily cleanup...');
    const results = {
      deletedProjects: 0,
      deletedAssets: 0,
      deletedExports: 0,
      deletedUsers: 0,
    };

    // 1. Hard-delete projects soft-deleted more than 30 days ago
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const deletedProjects = await this.prisma.project.deleteMany({
      where: { deletedAt: { lt: thirtyDaysAgo } },
    });
    results.deletedProjects = deletedProjects.count;

    // 2. Delete expired export jobs
    const expiredExports = await this.prisma.exportJob.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    results.deletedExports = expiredExports.count;

    // 3. Delete orphaned assets (soft-deleted more than 7 days ago)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const orphanedAssets = await this.prisma.asset.deleteMany({
      where: { deletedAt: { lt: sevenDaysAgo } },
    });
    results.deletedAssets = orphanedAssets.count;

    // 4. GDPR: delete accounts soft-deleted more than 90 days ago
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const deletedUsers = await this.prisma.user.deleteMany({
      where: { deletedAt: { lt: ninetyDaysAgo } },
    });
    results.deletedUsers = deletedUsers.count;

    this.logger.log(`Cleanup complete: ${JSON.stringify(results)}`);
    return results;
  }
}