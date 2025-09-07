import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProfileDeletionRepository } from '../repositories/profile-deletion.repository';
import { ProfileDeletionGateway } from '../gateways/profile-deletion.gateway';

@Injectable()
export class ProfileDeletionNotificationService {
  private readonly logger = new Logger(ProfileDeletionNotificationService.name);

  constructor(
    private readonly profileDeletionRepository: ProfileDeletionRepository,
    private readonly profileDeletionGateway: ProfileDeletionGateway,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkDeletionSchedules(): Promise<void> {
    this.logger.log('Проверка расписания удаления профилей');

    try {
      const usersWithScheduledDeletion =
        await this.profileDeletionRepository.findUsersWithDeletionScheduled();

      for (const user of usersWithScheduledDeletion) {
        if (!user.deletionScheduledAt) continue;

        const now = new Date();
        const deletionDate = new Date(user.deletionScheduledAt);
        const timeLeft = deletionDate.getTime() - now.getTime();

        const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
        const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));

        if (daysLeft === 7) {
          this.profileDeletionGateway.notifyDeletionWarning(user.id, 7);
          this.logger.log(
            `Отправлено предупреждение пользователю ${user.id}: 7 дней до удаления`,
          );
        } else if (daysLeft === 3) {
          this.profileDeletionGateway.notifyDeletionWarning(user.id, 3);
          this.logger.log(
            `Отправлено предупреждение пользователю ${user.id}: 3 дня до удаления`,
          );
        } else if (daysLeft === 1) {
          this.profileDeletionGateway.notifyDeletionWarning(user.id, 1);
          this.logger.log(
            `Отправлено предупреждение пользователю ${user.id}: 1 день до удаления`,
          );
        } else if (hoursLeft <= 24 && hoursLeft > 0) {
          this.profileDeletionGateway.notifyDeletionUrgent(user.id, hoursLeft);
          this.logger.log(
            `Отправлено срочное уведомление пользователю ${user.id}: ${hoursLeft} часов до удаления`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Ошибка при проверке расписания удаления: ${error.message}`,
      );
    }
  }

  async notifyDeletionCancelled(userId: number): Promise<void> {
    this.profileDeletionGateway.notifyDeletionCancelled(userId);
    this.logger.log(
      `Отправлено уведомление об отмене удаления пользователю ${userId}`,
    );
  }

  async notifyDeletionCompleted(userId: number): Promise<void> {
    this.profileDeletionGateway.notifyDeletionCompleted(userId);
    this.logger.log(
      `Отправлено уведомление о завершении удаления пользователю ${userId}`,
    );
  }
}
