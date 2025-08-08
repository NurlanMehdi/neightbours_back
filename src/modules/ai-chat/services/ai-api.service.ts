import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenRouterRequestDto {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_tokens_details?: any;
}

interface OpenRouterChoice {
  logprobs: any;
  finish_reason: string;
  native_finish_reason: string;
  index: number;
  message: {
    role: string;
    content: string;
    refusal: any;
    reasoning: any;
  };
}

interface OpenRouterResponseDto {
  id: string;
  provider: string;
  model: string;
  object: string;
  created: number;
  choices: OpenRouterChoice[];
  usage: OpenRouterUsage;
}

interface ChatResponseDto {
  response: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  generationTime: number;
}

@Injectable()
export class AiApiService {
  private readonly logger = new Logger(AiApiService.name);
  private readonly aiApiUrl: string;
  private readonly aiApiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.aiApiUrl = this.configService.get<string>('AI_API_URL') || 'https://openrouter.ai/api/v1';
    this.aiApiKey = this.configService.get<string>('AI_API_KEY') || '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';

    if (!this.aiApiKey) {
      this.logger.warn('AI_API_KEY не установлен в переменных окружения');
    }
  }

  /**
   * Отправляет сообщение в AI API
   * @param message Сообщение пользователя
   * @param temperature Температура генерации
   * @param maxTokens Максимальное количество токенов
   * @returns Ответ от AI
   */
  async sendMessage(
    message: string,
    temperature: number = 0.3,
    maxTokens: number = 1000,
  ): Promise<ChatResponseDto> {
    this.logger.log(`Отправка сообщения в OpenRouter API: ${message.substring(0, 100)}...`);

    try {
      const messages: OpenRouterMessage[] = [
        {
          role: 'system',
          content: 'Ты полезный помощник для приложения соседского сообщества. Отвечай на русском языке, будь дружелюбным и помогай пользователям с их вопросами о жизни в сообществе, недвижимости, мероприятиях и общении с соседями.',
        },
        {
          role: 'user',
          content: message,
        },
      ];

      const requestData: OpenRouterRequestDto = {
        model: 'deepseek/deepseek-chat-v3-0324:free',
        messages,
        temperature,
        max_tokens: maxTokens,
      };

      const response = await firstValueFrom(
        this.httpService.post<OpenRouterResponseDto>(
          `${this.aiApiUrl}/chat/completions`,
          requestData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.aiApiKey}`,
            },
            timeout: 60000, // 60 секунд таймаут
          },
        ),
      );

      this.logger.log(`Получен ответ от OpenRouter API: ${response.data.choices[0]?.message.content.substring(0, 100)}...`);

      // Преобразуем ответ OpenRouter в формат ChatResponseDto
      const openRouterResponse = response.data;
      const chatResponse: ChatResponseDto = {
        response: openRouterResponse.choices[0]?.message.content || 'Извините, получен пустой ответ.',
        inputTokens: openRouterResponse.usage.prompt_tokens,
        outputTokens: openRouterResponse.usage.completion_tokens,
        totalTokens: openRouterResponse.usage.total_tokens,
        generationTime: Date.now() - openRouterResponse.created * 1000,
      };

      return chatResponse;
    } catch (error) {
      this.logger.error('Ошибка при обращении к OpenRouter API:', error.message);

      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.error?.message || 'Ошибка AI сервиса';

        if (status === 401) {
          throw new HttpException('Неверный API ключ для AI сервиса', HttpStatus.FORBIDDEN);
        } else if (status === 400) {
          throw new HttpException('Некорректный запрос к AI сервису', HttpStatus.BAD_REQUEST);
        } else if (status >= 500) {
          throw new HttpException('AI сервис временно недоступен', HttpStatus.SERVICE_UNAVAILABLE);
        }

        throw new HttpException(message, status);
      }

      throw new HttpException('Не удалось связаться с AI сервисом', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  /**
   * Проверяет доступность OpenRouter API
   * @returns Статус здоровья API
   */
  async checkHealth(): Promise<{ status: string; model?: string; timestamp: number }> {
    try {
      // Для OpenRouter API можно проверить доступность через простой запрос к models endpoint
      const response = await firstValueFrom(
        this.httpService.get<any>(`${this.aiApiUrl}/models`, {
          headers: {
            'Authorization': `Bearer ${this.aiApiKey}`,
          },
          timeout: 10000, // 10 секунд таймаут для health check
        }),
      );

      return {
        status: response.status === 200 ? 'healthy' : 'unhealthy',
        model: 'deepseek/deepseek-chat-v3-0324:free',
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error('OpenRouter API недоступен:', error.message);
      return {
        status: 'unhealthy',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Получает информацию о конфигурации OpenRouter API
   * @returns Информация о конфигурации
   */
  async getApiInfo(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<any>(`${this.aiApiUrl}/models`, {
          headers: {
            'Authorization': `Bearer ${this.aiApiKey}`,
          },
          timeout: 10000,
        }),
      );

      return {
        provider: 'OpenRouter',
        model: 'deepseek/deepseek-chat-v3-0324:free',
        apiUrl: this.aiApiUrl,
        availableModels: response.data.data?.length || 0,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error('Ошибка при получении информации о OpenRouter API:', error.message);
      throw new HttpException('Не удалось получить информацию о AI сервисе', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
