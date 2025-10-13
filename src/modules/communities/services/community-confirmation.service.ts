import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationEventService } from '../../notifications/services/notification-event.service';
import { CommunityConfirmationConfig } from '../config/community-confirmation.config';

@Injectable()
export class CommunityConfirmationService {
  private readonly logger = new Logger(CommunityConfirmationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationEventService: NotificationEventService,
  ) {}

  calculateConfirmationDeadline(): Date {
    return CommunityConfirmationConfig.calculateConfirmationDeadline();
  }

  async activateCommunity(communityId: number, creatorId: number): Promise<void> {
    this.logger.log(`Активация сообщества ${communityId}`);

    await this.prisma.community.update({
      where: { id: communityId },
      data: {
        status: 'ACTIVE',
        isActive: true,
        confirmedAt: new Date(),
        confirmationDeadline: null,
      },
    });

    await this.notificationEventService.notifyCommunityStatusChange({
      userId: creatorId,
      communityId,
      status: 'ACTIVE',
      type: 'COMMUNITY_APPROVED',
    });

    this.logger.log(`Сообщество ${communityId} активировано`);
  }

  async rejectCommunity(communityId: number, creatorId: number): Promise<void> {
    this.logger.log(`Отклонение сообщества ${communityId}`);

    await this.notificationEventService.notifyCommunityStatusChange({
      userId: creatorId,
      communityId,
      status: 'REJECTED',
      type: 'COMMUNITY_REJECTED',
    });

    await this.prisma.community.update({
      where: { id: communityId },
      data: {
        isActive: false,
        status: 'INACTIVE',
      },
    });

    this.logger.log(`Сообщество ${communityId} отклонено и деактивировано`);
  }

  async processExpiredCommunities(): Promise<void> {
    this.logger.log('Обработка истекших сообществ');

    const expiredCommunities = await this.prisma.community.findMany({
      where: {
        status: 'INACTIVE',
        isActive: true,
        confirmationDeadline: {
          lte: new Date(),
        },
      },
      include: {
        users: {
          where: {
            joinedViaCode: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    for (const community of expiredCommunities) {
      const joinedCount = community.users.length;
      
      if (joinedCount >= CommunityConfirmationConfig.requiredMembersCount) {
        await this.activateCommunity(community.id, community.createdBy);
      } else {
        await this.rejectCommunity(community.id, community.createdBy);
      }
    }

    this.logger.log(`Обработано ${expiredCommunities.length} истекших сообществ`);
  }

  async adminConfirmCommunity(communityId: number, adminId: number): Promise<void> {
    this.logger.log(`Административное подтверждение сообщества ${communityId} администратором ${adminId}`);

    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      select: { createdBy: true },
    });

    if (!community) {
      throw new Error('Сообщество не найдено');
    }

    await this.prisma.community.update({
      where: { id: communityId },
      data: {
        status: 'ACTIVE',
        isActive: true,
        confirmedAt: new Date(),
        confirmationDeadline: null,
      },
    });

    await this.notificationEventService.notifyCommunityStatusChange({
      userId: community.createdBy,
      communityId,
      status: 'ACTIVE',
      type: 'COMMUNITY_APPROVED',
    });

    this.logger.log(`Сообщество ${communityId} подтверждено администратором`);
  }
}