import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PropertyConfirmationService } from './property-confirmation.service';

@Injectable()
export class PropertyConfirmationCronService {
  private readonly logger = new Logger(PropertyConfirmationCronService.name);

  constructor(
    private readonly propertyConfirmationService: PropertyConfirmationService,
  ) {}

  // Run hourly to cleanup unconfirmed properties older than 24h
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpired(): Promise<void> {
    try {
      const deleted = await this.propertyConfirmationService.cleanupExpiredProperties();
      if (deleted > 0) {
        this.logger.log(`Удалено просроченных неподтвержденных объектов: ${deleted}`);
      }
    } catch (error) {
      this.logger.error(`Ошибка очистки неподтвержденных объектов: ${error?.message || error}`);
    }
  }
}

