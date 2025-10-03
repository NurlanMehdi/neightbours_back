import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { CommunityRepository } from '../repositories/community.repository';
import { NotificationService } from '../../notifications/services/notification.service';
import { NotificationType } from '../../notifications/interfaces/notification.interface';
import { CommunityConfirmationConfig } from '../config/community-confirmation.config';

@Injectable()
export class CommunityConfirmationService {
  private readonly logger = new Logger(CommunityConfirmationService.name);

  constructor(
    private readonly communityRepository: CommunityRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async processExpiredCommunities(): Promise<{ activated: number; deleted: number }> {
    this.logger.log('Запуск обработки истекших сообществ');

    const communities = await this.communityRepository.findInactiveCommunitiesPastDeadline();
    
    let activated = 0;
    let deleted = 0;

    for (const community of communities) {
      const joinedCount = ((community as any).users || []).filter((u: any) => u.joinedViaCode).length;
      
      if (joinedCount >= CommunityConfirmationConfig.requiredMembersCount) {
        await this.activateCommunity(community.id, community.createdBy);
        activated++;
      } else {
        await this.deleteCommunity(community.id, community.createdBy, community.name);
        deleted++;
      }
    }

    this.logger.log(
      `Обработка завершена: активировано ${activated}, удалено ${deleted}`,
    );

    return { activated, deleted };
  }

  async activateCommunity(communityId: number, creatorId: number): Promise<void> {
    this.logger.log(`Активация сообщества ${communityId}`);
    
    await this.communityRepository.activateCommunity(communityId);

    try {
      await this.notificationService.createNotification({
        type: NotificationType.COMMUNITY_APPROVED,
        title: 'Сообщество подтверждено',
        message: 'Ваше сообщество успешно подтверждено и активировано.',
        userId: creatorId,
        payload: { communityId },
      });
    } catch (error) {
      this.logger.error(
        `Ошибка отправки уведомления о подтверждении сообщества ${communityId}`,
        error,
      );
    }
  }

  async deleteCommunity(
    communityId: number,
    creatorId: number,
    communityName: string,
  ): Promise<void> {
    this.logger.log(`Удаление сообщества ${communityId} из-за истечения срока`);
    
    await this.communityRepository.hardDelete(communityId);

    try {
      await this.notificationService.createNotification({
        type: NotificationType.COMMUNITY_REJECTED,
        title: 'Сообщество не подтверждено',
        message: `Ваше сообщество "${communityName}" было удалено, так как в течение 24 часов к нему не присоединилось минимум ${CommunityConfirmationConfig.requiredMembersCount} участника.`,
        userId: creatorId,
        payload: { communityId },
      });
    } catch (error) {
      this.logger.error(
        `Ошибка отправки уведомления об отклонении сообщества ${communityId}`,
        error,
      );
    }
  }

  async manuallyConfirmCommunity(communityId: number): Promise<void> {
    this.logger.log(`Ручное подтверждение сообщества ${communityId} администратором`);

    const community = await this.communityRepository.findByIdForAdmin(communityId);
    if (!community) {
      throw new NotFoundException(`Сообщество с ID ${communityId} не найдено`);
    }

    if (community.status === 'ACTIVE') {
      throw new BadRequestException(`Сообщество с ID ${communityId} уже активно`);
    }

    await this.communityRepository.activateCommunity(communityId);

    try {
      await this.notificationService.createNotification({
        type: NotificationType.COMMUNITY_APPROVED,
        title: 'Сообщество подтверждено',
        message: 'Ваше сообщество было подтверждено администратором и активировано.',
        userId: community.createdBy,
        payload: { communityId },
      });
    } catch (error) {
      this.logger.error(
        `Ошибка отправки уведомления о ручном подтверждении сообщества ${communityId}`,
        error,
      );
    }
  }

  calculateConfirmationDeadline(): Date {
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + CommunityConfirmationConfig.confirmationTimeoutHours);
    return deadline;
  }
}

