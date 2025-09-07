import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserId } from '../../../common/decorators/user-id.decorator';
import { AiChatService } from '../services/ai-chat.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { GetChatHistoryDto } from '../dto/get-chat-history.dto';
import { AiChatMessageDto } from '../dto/ai-chat-message.dto';
import { AiChatDto } from '../dto/ai-chat.dto';
import { ApiStandardResponses } from '../../../common/decorators/api-responses.decorator';

@ApiTags('AI Чат')
@Controller('ai-chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('send')
  @ApiOperation({
    summary: 'Отправить сообщение AI ассистенту',
    description: 'Отправляет сообщение в AI чат и получает ответ от ассистента',
  })
  @ApiResponse({
    status: 200,
    description: 'Ответ от AI ассистента',
    type: AiChatMessageDto,
  })
  @ApiStandardResponses()
  async sendMessage(
    @UserId() userId: number,
    @Body() dto: SendMessageDto,
  ): Promise<AiChatMessageDto> {
    return this.aiChatService.sendMessage(userId, dto);
  }

  @Get('history')
  @ApiOperation({
    summary: 'Получить историю чата',
    description: 'Получает историю сообщений в AI чате с пагинацией',
  })
  @ApiResponse({
    status: 200,
    description: 'История сообщений',
    schema: {
      type: 'object',
      properties: {
        messages: {
          type: 'array',
          items: { $ref: '#/components/schemas/AiChatMessageDto' },
        },
        total: { type: 'number', example: 150 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 50 },
        totalPages: { type: 'number', example: 3 },
      },
    },
  })
  @ApiStandardResponses()
  async getChatHistory(
    @UserId() userId: number,
    @Query() query: GetChatHistoryDto,
  ) {
    return this.aiChatService.getChatHistory(userId, query);
  }

  @Get('chat')
  @ApiOperation({
    summary: 'Получить чат пользователя',
    description:
      'Получает или создает чат пользователя с последними сообщениями',
  })
  @ApiResponse({
    status: 200,
    description: 'Чат пользователя',
    type: AiChatDto,
  })
  @ApiStandardResponses()
  async getOrCreateChat(@UserId() userId: number): Promise<AiChatDto> {
    return this.aiChatService.getOrCreateChat(userId);
  }

  @Delete('clear')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Очистить историю чата',
    description: 'Удаляет все сообщения из чата пользователя',
  })
  @ApiResponse({
    status: 204,
    description: 'История чата успешно очищена',
  })
  @ApiStandardResponses()
  async clearChatHistory(@UserId() userId: number): Promise<void> {
    return this.aiChatService.clearChatHistory(userId);
  }

  @Get('health')
  @ApiOperation({
    summary: 'Проверить состояние AI сервиса',
    description: 'Проверяет доступность внешнего AI API',
  })
  @ApiResponse({
    status: 200,
    description: 'Статус AI сервиса',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['healthy', 'unhealthy'],
          example: 'healthy',
        },
        model: { type: 'string', example: 'llama3.2' },
        timestamp: { type: 'number', example: 1703123456789 },
      },
    },
  })
  @ApiStandardResponses()
  async checkAiServiceHealth() {
    return this.aiChatService.checkAiServiceHealth();
  }
}
