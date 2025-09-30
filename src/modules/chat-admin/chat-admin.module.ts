import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ChatAdminController } from './chat-admin.controller';
import { ChatAdminService } from './chat-admin.service';
import { GlobalChatSettingsService } from './services/global-chat-settings.service';
import { ChatCleanupService } from './services/chat-cleanup.service';

@Module({
  imports: [PrismaModule],
  controllers: [ChatAdminController],
  providers: [ChatAdminService, GlobalChatSettingsService, ChatCleanupService],
  exports: [ChatAdminService, GlobalChatSettingsService, ChatCleanupService],
})
export class ChatAdminModule {}
