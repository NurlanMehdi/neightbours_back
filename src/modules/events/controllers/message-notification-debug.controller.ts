import { Controller, Get, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UnifiedMessageNotificationService } from '../services/unified-message-notification.service';

/**
 * Контроллер для отладки системы уведомлений о сообщениях
 * Предоставляет информацию о состоянии кеша дедупликации
 */
@ApiTags('Отладка уведомлений')
@Controller('debug/message-notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessageNotificationDebugController {
  constructor(
    private readonly unifiedMessageNotificationService: UnifiedMessageNotificationService,
  ) {}

  @Get('cache-stats')
  @ApiOperation({ 
    summary: 'Получить статистику кеша дедупликации уведомлений',
    description: 'Возвращает информацию о состоянии кеша дедупликации: количество записей, истекших записей, временные метки'
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика кеша дедупликации',
    schema: {
      type: 'object',
      properties: {
        totalEntries: {
          type: 'number',
          description: 'Общее количество записей в кеше',
          example: 150
        },
        expiredEntries: {
          type: 'number', 
          description: 'Количество истекших записей',
          example: 25
        },
        activeEntries: {
          type: 'number',
          description: 'Количество активных записей',
          example: 125
        },
        oldestEntry: {
          type: 'string',
          format: 'date-time',
          description: 'Время создания самой старой записи',
          example: '2023-09-12T10:30:00.000Z'
        },
        newestEntry: {
          type: 'string',
          format: 'date-time',
          description: 'Время создания самой новой записи',
          example: '2023-09-12T14:45:00.000Z'
        }
      }
    }
  })
  getCacheStats() {
    return this.unifiedMessageNotificationService.getCacheStats();
  }

  @Delete('cache')
  @ApiOperation({ 
    summary: 'Очистить кеш дедупликации уведомлений',
    description: 'Полностью очищает кеш дедупликации. ВНИМАНИЕ: после очистки возможны дубликаты уведомлений!'
  })
  @ApiResponse({
    status: 200,
    description: 'Кеш успешно очищен',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true
        },
        message: {
          type: 'string',
          example: 'Кеш дедупликации очищен'
        }
      }
    }
  })
  clearCache() {
    this.unifiedMessageNotificationService.clearCache();
    return {
      success: true,
      message: 'Кеш дедупликации очищен'
    };
  }
}
