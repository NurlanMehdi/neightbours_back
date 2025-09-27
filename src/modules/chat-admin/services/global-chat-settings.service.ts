import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GlobalChatSettings } from '@prisma/client';

@Injectable()
export class GlobalChatSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<GlobalChatSettings> {
    let settings = await this.prisma.globalChatSettings.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!settings) {
      settings = await this.prisma.globalChatSettings.create({
        data: {
          allowCommunityChat: true,
          allowEventChat: true,
          allowPrivateChat: true,
          messageRetentionDays: 365,
          maxMessageLength: 1000,
          moderationEnabled: true,
        },
      });
    }

    return settings;
  }

  async isCommunityChatAllowed(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.allowCommunityChat;
  }

  async isEventChatAllowed(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.allowEventChat;
  }

  async isPrivateChatAllowed(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.allowPrivateChat;
  }

  async isModerationEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.moderationEnabled;
  }

  async getMaxMessageLength(): Promise<number> {
    const settings = await this.getSettings();
    return settings.maxMessageLength;
  }

  async getMessageRetentionDays(): Promise<number> {
    const settings = await this.getSettings();
    return settings.messageRetentionDays;
  }
}
