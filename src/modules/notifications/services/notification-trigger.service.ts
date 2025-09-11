import { Injectable, Logger } from '@nestjs/common';
import {
  ISystemEventData,
  INotificationTrigger,
} from '../interfaces/notification.interface';
import { EventNotificationTrigger } from '../triggers/event-notification.trigger';
import { CommunityNotificationTrigger } from '../triggers/community-notification.trigger';
import { MessageNotificationTrigger } from '../triggers/message-notification.trigger';

/**
 * Сервис для управления триггерами уведомлений
 */
@Injectable()
export class NotificationTriggerService {
  private readonly logger = new Logger(NotificationTriggerService.name);
  private readonly triggers: INotificationTrigger[] = [];

  constructor(
    private readonly eventTrigger: EventNotificationTrigger,
    private readonly communityTrigger: CommunityNotificationTrigger,
    private readonly messageTrigger: MessageNotificationTrigger,
  ) {
    // Регистрируем триггеры событий, сообществ и сообщений
    this.triggers = [this.eventTrigger, this.communityTrigger, this.messageTrigger];

    this.logger.log(
      `Зарегистрировано ${this.triggers.length} триггеров уведомлений`,
    );
  }

  /**
   * Обрабатывает системное событие всеми подходящими триггерами
   */
  async processSystemEvent(eventData: ISystemEventData): Promise<void> {
    this.logger.log(`Обработка системного события: ${eventData.eventType}`);

    if (!eventData.eventType) {
      this.logger.warn('Отсутствует тип события');
      return;
    }

    const processingPromises = this.triggers.map(async (trigger) => {
      try {
        this.logger.log(
          `Проверяем триггер ${trigger.constructor.name} для события ${eventData.eventType}`,
        );
        await trigger.safeHandle(eventData);
      } catch (error) {
        this.logger.error(
          `Ошибка в триггере ${trigger.constructor.name}: ${error.message}`,
          error.stack,
        );
      }
    });

    // Обрабатываем все триггеры параллельно
    await Promise.allSettled(processingPromises);
    this.logger.log(`Завершена обработка события: ${eventData.eventType}`);
  }

  /**
   * Добавляет новый триггер
   */
  registerTrigger(trigger: INotificationTrigger): void {
    this.triggers.push(trigger);
    this.logger.log(
      `Зарегистрирован новый триггер: ${trigger.constructor.name}`,
    );
  }

  /**
   * Получает список зарегистрированных триггеров
   */
  getRegisteredTriggers(): string[] {
    return this.triggers.map((trigger) => trigger.constructor.name);
  }

  /**
   * Проверяет работоспособность всех триггеров
   */
  async healthCheck(): Promise<{ status: string; triggers: string[] }> {
    this.logger.log('Проверка работоспособности триггеров');

    return {
      status: 'healthy',
      triggers: this.getRegisteredTriggers(),
    };
  }
}
