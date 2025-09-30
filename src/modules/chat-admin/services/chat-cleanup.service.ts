import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { GlobalChatSettingsService } from './global-chat-settings.service';

@Injectable()
export class ChatCleanupService {
  private readonly logger = new Logger(ChatCleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly globalChatSettings: GlobalChatSettingsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldMessages(): Promise<void> {
    try {
      this.logger.log('Starting daily message cleanup...');

      const retentionDays =
        await this.globalChatSettings.getMessageRetentionDays();

      if (retentionDays === 0) {
        this.logger.log(
          'Message retention is disabled (0 days), skipping cleanup',
        );
        return;
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      this.logger.log(
        `Cleaning up messages older than ${retentionDays} days (before ${cutoffDate.toISOString()})`,
      );

      // Clean up community messages
      const communityResult = await (
        this.prisma as any
      ).communityMessage.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
          isDeleted: false,
        },
      });

      // Clean up event messages
      const eventResult = await (this.prisma as any).eventMessage.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
          isDeleted: false,
        },
      });

      // Clean up private messages
      const privateResult = await (
        this.prisma as any
      ).privateMessage.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      const totalDeleted =
        communityResult.count + eventResult.count + privateResult.count;

      this.logger.log(`Message cleanup completed:`);
      this.logger.log(`- Community messages deleted: ${communityResult.count}`);
      this.logger.log(`- Event messages deleted: ${eventResult.count}`);
      this.logger.log(`- Private messages deleted: ${privateResult.count}`);
      this.logger.log(`- Total messages deleted: ${totalDeleted}`);
    } catch (error) {
      this.logger.error(
        `Error during message cleanup: ${error.message}`,
        error.stack,
      );
    }
  }

  async cleanupMessagesManually(
    retentionDays?: number,
  ): Promise<{ deleted: number }> {
    const days =
      retentionDays ??
      (await this.globalChatSettings.getMessageRetentionDays());

    if (days === 0) {
      this.logger.log(
        'Message retention is disabled (0 days), skipping manual cleanup',
      );
      return { deleted: 0 };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    this.logger.log(
      `Manual cleanup: deleting messages older than ${days} days (before ${cutoffDate.toISOString()})`,
    );

    // Clean up community messages
    const communityResult = await (
      this.prisma as any
    ).communityMessage.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        isDeleted: false,
      },
    });

    // Clean up event messages
    const eventResult = await (this.prisma as any).eventMessage.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        isDeleted: false,
      },
    });

    // Clean up private messages
    const privateResult = await (this.prisma as any).privateMessage.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    const totalDeleted =
      communityResult.count + eventResult.count + privateResult.count;

    this.logger.log(
      `Manual cleanup completed: ${totalDeleted} messages deleted`,
    );

    return { deleted: totalDeleted };
  }
}
