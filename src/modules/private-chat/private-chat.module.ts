import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatAdminModule } from '../chat-admin/chat-admin.module';
import { PrivateChatService } from './private-chat.service';
import { PrivateChatController } from './private-chat.controller';
import { PrivateChatRepository } from './repositories/private-chat.repository';
import { PrivateChatGateway } from './private-chat.gateway';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '30d' },
    }),
    PrismaModule,
    forwardRef(() => NotificationsModule),
    ChatAdminModule,
  ],
  controllers: [PrivateChatController],
  providers: [PrivateChatService, PrivateChatRepository, PrivateChatGateway],
  exports: [PrivateChatService],
})
export class PrivateChatModule {}

