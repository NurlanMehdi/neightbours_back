import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { ChatAdminModule } from '../chat-admin/chat-admin.module';
import { CommunityChatService } from './community-chat.service';
import { CommunityChatRepository } from './repositories/community-chat.repository';
import { CommunityChatController } from './community-chat.controller';
import { CommunityChatGateway } from './community-chat.gateway';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    UsersModule,
    ChatAdminModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: '12h' },
      }),
    }),
  ],
  controllers: [CommunityChatController],
  providers: [
    CommunityChatService,
    CommunityChatRepository,
    CommunityChatGateway,
  ],
  exports: [CommunityChatService, CommunityChatGateway],
})
export class CommunityChatModule {}
