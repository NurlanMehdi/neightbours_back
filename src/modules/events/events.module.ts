import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventsAdminController } from './controllers/events.admin.controller';
import { MessageNotificationDebugController } from './controllers/message-notification-debug.controller';
import { EventsRepository } from './repositories/events.repository';
import { EventMessagesRepository } from './repositories/event-messages.repository';
import { VotingRepository } from './repositories/voting.repository';
import { UnifiedMessageNotificationService } from './services/unified-message-notification.service';
import { JwtModule } from '@nestjs/jwt';
import { EventsGateway } from './events.gateway';
import { MulterConfigModule } from '../files/multer.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ChatAdminModule } from '../chat-admin/chat-admin.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '30d' },
    }),
    MulterConfigModule,
    NotificationsModule,
    UsersModule,
    PrismaModule,
    ChatAdminModule,
  ],
  controllers: [EventsController, EventsAdminController, MessageNotificationDebugController],
  providers: [
    EventsService,
    EventsRepository,
    EventMessagesRepository,
    VotingRepository,
    UnifiedMessageNotificationService,
    EventsGateway,
  ],
  exports: [EventsService, EventsGateway],
})
export class EventsModule {}
