import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchMessagesResponseDto } from './dto/search-messages-response.dto';

/**
 * Сервис для работы с поиском сообщений
 */
@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Поиск сообщений по всем источникам (события, сообщества, приватные чаты)
   * @param userId ID пользователя
   * @param query Поисковый запрос
   * @returns Результаты поиска по всем источникам
   */
  async searchAllMessages(
    userId: number,
    query: string,
  ): Promise<SearchMessagesResponseDto> {
    const [eventMessages, communityMessages, privateMessages] =
      await Promise.all([
        this.searchEventMessages(userId, query),
        this.searchCommunityMessages(userId, query),
        this.searchPrivateMessages(userId, query),
      ]);

    return {
      events: eventMessages,
      communities: communityMessages,
      private: privateMessages,
    };
  }

  /**
   * Поиск сообщений в событиях
   * Пользователь должен быть участником события
   */
  private async searchEventMessages(userId: number, query: string) {
    return this.prisma.eventMessage.findMany({
      where: {
        text: {
          contains: query,
          mode: 'insensitive',
        },
        isDeleted: false,
        isModerated: true,
        event: {
          participants: {
            some: {
              userId,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Поиск сообщений в сообществах
   * Пользователь должен быть членом сообщества
   */
  private async searchCommunityMessages(userId: number, query: string) {
    return this.prisma.communityMessage.findMany({
      where: {
        text: {
          contains: query,
          mode: 'insensitive',
        },
        isDeleted: false,
        isModerated: true,
        community: {
          users: {
            some: {
              userId,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Поиск приватных сообщений
   * Пользователь должен быть отправителем или получателем
   */
  private async searchPrivateMessages(userId: number, query: string) {
    return this.prisma.privateMessage.findMany({
      where: {
        text: {
          contains: query,
          mode: 'insensitive',
        },
        conversation: {
          participants: {
            some: {
              userId,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

