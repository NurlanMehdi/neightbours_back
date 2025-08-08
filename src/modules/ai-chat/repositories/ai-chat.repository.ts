import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AiChatMessageRole } from '@prisma/client';
import { GetChatHistoryDto } from '../dto/get-chat-history.dto';

@Injectable()
export class AiChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Получает или создает чат для пользователя
   * @param userId ID пользователя
   * @returns Чат пользователя
   */
  async findOrCreateChatByUserId(userId: number) {
    let chat = await this.prisma.aiChat.findUnique({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Получаем последние 50 сообщений
        },
      },
    });

    if (!chat) {
      chat = await this.prisma.aiChat.create({
        data: { userId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
        },
      });
    }

    return chat;
  }

  /**
   * Получает историю чата с пагинацией
   * @param userId ID пользователя
   * @param query Параметры пагинации
   * @returns История сообщений
   */
  async getChatHistory(userId: number, query: GetChatHistoryDto) {
    const { page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const chat = await this.prisma.aiChat.findUnique({
      where: { userId },
    });

    if (!chat) {
      return {
        messages: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const [messages, total] = await Promise.all([
      this.prisma.aiChatMessage.findMany({
        where: { chatId: chat.id },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.aiChatMessage.count({
        where: { chatId: chat.id },
      }),
    ]);

    return {
      messages: messages.reverse(), // Возвращаем в хронологическом порядке
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Добавляет сообщение пользователя в чат
   * @param userId ID пользователя
   * @param content Содержание сообщения
   * @returns Созданное сообщение
   */
  async addUserMessage(userId: number, content: string) {
    const chat = await this.findOrCreateChatByUserId(userId);

    return this.prisma.aiChatMessage.create({
      data: {
        chatId: chat.id,
        userId,
        role: AiChatMessageRole.USER,
        content,
      },
    });
  }

  /**
   * Добавляет ответ ассистента в чат
   * @param userId ID пользователя
   * @param content Содержание ответа
   * @returns Созданное сообщение
   */
  async addAssistantMessage(userId: number, content: string) {
    const chat = await this.findOrCreateChatByUserId(userId);

    return this.prisma.aiChatMessage.create({
      data: {
        chatId: chat.id,
        userId,
        role: AiChatMessageRole.ASSISTANT,
        content,
      },
    });
  }

  /**
   * Получает последние N сообщений для контекста
   * @param userId ID пользователя
   * @param limit Количество сообщений
   * @returns Последние сообщения
   */
  async getRecentMessages(userId: number, limit: number = 10) {
    const chat = await this.prisma.aiChat.findUnique({
      where: { userId },
    });

    if (!chat) {
      return [];
    }

    const messages = await this.prisma.aiChatMessage.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return messages.reverse(); // Возвращаем в хронологическом порядке
  }

  /**
   * Обновляет время последнего обновления чата
   * @param userId ID пользователя
   */
  async updateChatTimestamp(userId: number) {
    const chat = await this.prisma.aiChat.findUnique({
      where: { userId },
    });

    if (chat) {
      await this.prisma.aiChat.update({
        where: { id: chat.id },
        data: { updatedAt: new Date() },
      });
    }
  }

  /**
   * Очищает историю чата пользователя
   * @param userId ID пользователя
   */
  async clearChatHistory(userId: number) {
    const chat = await this.prisma.aiChat.findUnique({
      where: { userId },
    });

    if (chat) {
      await this.prisma.aiChatMessage.deleteMany({
        where: { chatId: chat.id },
      });
    }
  }
}
