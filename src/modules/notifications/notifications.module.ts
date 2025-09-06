import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { FirebaseModule } from '../../firebase/firebase.module';

// Controllers
import { NotificationsController } from './controllers/notifications.controller';

// Services
import { NotificationService } from './services/notification.service';
import { NotificationTriggerService } from './services/notification-trigger.service';
import { NotificationEventService } from './services/notification-event.service';

// Repositories
import { NotificationRepository } from './repositories/notification.repository';

// Gateways
import { NotificationsGateway } from './gateways/notifications.gateway';

// Triggers
import { EventNotificationTrigger } from './triggers/event-notification.trigger';
import { CommunityNotificationTrigger } from './triggers/community-notification.trigger';

/**
 * Модуль уведомлений
 * 
 * Предоставляет универсальную систему уведомлений с поддержкой:
 * - Создания и управления уведомлениями
 * - Триггеров для автоматического создания уведомлений
 * - API для работы с уведомлениями
 * - Расширяемой архитектуры для новых типов событий
 */
@Module({
  imports: [
    PrismaModule, 
    FirebaseModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    // Основные сервисы
    NotificationService,
    NotificationTriggerService,
    NotificationEventService,
    
    // Репозиторий
    NotificationRepository,
    
    // WebSocket Gateway
    NotificationsGateway,
    
    // Триггеры уведомлений
    EventNotificationTrigger,
    CommunityNotificationTrigger,
  ],
  exports: [
    NotificationService,
    NotificationTriggerService,
    NotificationEventService,
    NotificationRepository,
    NotificationsGateway,
  ],
})
export class NotificationsModule {}
