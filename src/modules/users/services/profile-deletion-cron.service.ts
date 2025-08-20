import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProfileDeletionService } from './profile-deletion.service';

@Injectable()
export class ProfileDeletionCronService {
  private readonly logger = new Logger(ProfileDeletionCronService.name);

  constructor(private readonly profileDeletionService: ProfileDeletionService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleScheduledDeletions(): Promise<void> {
    this.logger.log('Запуск ежедневной задачи удаления профилей');
    
    try {
      await this.profileDeletionService.processScheduledDeletions();
      this.logger.log('Ежедневная задача удаления профилей завершена успешно');
    } catch (error) {
      this.logger.error(`Ошибка при выполнении ежедневной задачи удаления профилей: ${error.message}`);
    }
  }
}
