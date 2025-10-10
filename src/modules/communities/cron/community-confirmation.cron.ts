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
  async processExpiredCommunities(): Promise<void> {
    this.logger.log('Запуск обработки истекших сообществ');
    
    try {
      await this.confirmationService.processExpiredCommunities();
      this.logger.log('Обработка истекших сообществ завершена');
    } catch (error) {
      this.logger.error(`Ошибка при обработке истекших сообществ: ${error.message}`);
    }
  }
}