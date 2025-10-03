import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CommunityConfirmationService } from '../services/community-confirmation.service';

@Injectable()
export class CommunityConfirmationCron {
  private readonly logger = new Logger(CommunityConfirmationCron.name);

  constructor(
    private readonly confirmationService: CommunityConfirmationService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCommunityConfirmation() {
    this.logger.log('Запуск проверки подтверждения сообществ');

    try {
      const result = await this.confirmationService.processExpiredCommunities();
      
      this.logger.log(
        `Проверка завершена: активировано ${result.activated}, удалено ${result.deleted}`,
      );
    } catch (error) {
      this.logger.error('Ошибка при обработке подтверждения сообществ', error);
    }
  }
}

