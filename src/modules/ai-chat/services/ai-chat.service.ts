import { Injectable, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { AiChatRepository } from '../repositories/ai-chat.repository';
import { AiApiService } from './ai-api.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { GetChatHistoryDto } from '../dto/get-chat-history.dto';
import { AiChatMessageDto } from '../dto/ai-chat-message.dto';
import { AiChatDto } from '../dto/ai-chat.dto';

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    private readonly aiChatRepository: AiChatRepository,
    private readonly aiApiService: AiApiService,
  ) {}

  /**
   * Отправляет сообщение в AI чат
   * @param userId ID пользователя
   * @param dto Данные сообщения
   * @returns Ответ от AI ассистента
   */
  async sendMessage(
    userId: number,
    dto: SendMessageDto,
  ): Promise<AiChatMessageDto> {
    this.logger.log(`Пользователь ${userId} отправляет сообщение в AI чат`);

    try {
      // Сохраняем сообщение пользователя
      const userMessage = await this.aiChatRepository.addUserMessage(
        userId,
        dto.message,
      );
      this.logger.log(`Сохранено сообщение пользователя: ${userMessage.id}`);

      // Получаем последние сообщения для контекста
      const recentMessages = await this.aiChatRepository.getRecentMessages(
        userId,
        10,
      );

      // Формируем контекст для AI (последние 5 пар сообщений)
      let contextMessage = dto.message;
      if (recentMessages.length > 1) {
        const contextMessages = recentMessages.slice(-10); // Последние 10 сообщений
        const contextParts = contextMessages.map(
          (msg) =>
            `${msg.role === 'USER' ? 'Пользователь' : 'Ассистент'}: ${msg.content}`,
        );
        contextMessage = `Контекст предыдущих сообщений:\n${contextParts.join('\n')}\n\nТекущий вопрос: ${dto.message}`;
      }

      // Отправляем запрос к AI API
      const aiResponse = await this.aiApiService.sendMessage(
        contextMessage,
        0.3,
        dto.maxTokens,
      );

      // Сохраняем ответ ассистента
      const assistantMessage = await this.aiChatRepository.addAssistantMessage(
        userId,
        aiResponse.response,
      );

      // Обновляем время последнего обновления чата
      await this.aiChatRepository.updateChatTimestamp(userId);

      this.logger.log(`Сохранен ответ ассистента: ${assistantMessage.id}`);

      return plainToInstance(AiChatMessageDto, assistantMessage);
    } catch (error) {
      this.logger.error(
        `Ошибка при отправке сообщения пользователем ${userId}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Получает историю чата пользователя
   * @param userId ID пользователя
   * @param query Параметры пагинации
   * @returns История сообщений
   */
  async getChatHistory(userId: number, query: GetChatHistoryDto) {
    this.logger.log(`Получение истории чата для пользователя ${userId}`);

    const result = await this.aiChatRepository.getChatHistory(userId, query);

    return {
      ...result,
      messages: result.messages.map((message) =>
        plainToInstance(AiChatMessageDto, message),
      ),
    };
  }

  /**
   * Получает или создает чат пользователя
   * @param userId ID пользователя
   * @returns Чат пользователя
   */
  async getOrCreateChat(userId: number): Promise<AiChatDto> {
    this.logger.log(`Получение чата для пользователя ${userId}`);

    const chat = await this.aiChatRepository.findOrCreateChatByUserId(userId);

    return plainToInstance(AiChatDto, {
      ...chat,
      messages: chat.messages.map((message) =>
        plainToInstance(AiChatMessageDto, message),
      ),
    });
  }

  /**
   * Очищает историю чата пользователя
   * @param userId ID пользователя
   */
  async clearChatHistory(userId: number): Promise<void> {
    this.logger.log(`Очистка истории чата для пользователя ${userId}`);

    await this.aiChatRepository.clearChatHistory(userId);
  }

  /**
   * Проверяет статус AI сервиса
   * @returns Статус здоровья AI API
   */
  async checkAiServiceHealth() {
    this.logger.log('Проверка состояния AI сервиса');

    return this.aiApiService.checkHealth();
  }

  /**
   * Получает информацию о AI API
   * @returns Информация о конфигурации AI API
   */
  async getAiApiInfo() {
    this.logger.log('Получение информации о AI API');

    return this.aiApiService.getApiInfo();
  }
}
