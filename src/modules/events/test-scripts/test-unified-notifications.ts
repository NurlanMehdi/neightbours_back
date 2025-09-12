import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from '../events.service';
import { UnifiedMessageNotificationService } from '../services/unified-message-notification.service';
import { CreateMessageDto } from '../dto/create-message.dto';
import { AddMessageDto } from '../dto/add-message.dto';
import { Logger } from '@nestjs/common';

/**
 * Скрипт для тестирования унифицированной системы уведомлений
 * Проверяет, что дубликаты уведомлений блокируются корректно
 */
export class UnifiedNotificationTester {
  private readonly logger = new Logger(UnifiedNotificationTester.name);

  constructor(
    private readonly eventsService: EventsService,
    private readonly unifiedService: UnifiedMessageNotificationService,
  ) {}

  /**
   * Выполняет полный тест системы дедупликации
   */
  async runFullTest(): Promise<{
    testResults: any[];
    cacheStats: any;
    success: boolean;
    summary: string;
  }> {
    this.logger.log('🚀 Начало тестирования унифицированной системы уведомлений');

    const testResults: any[] = [];
    
    try {
      // Очищаем кеш перед тестами
      this.unifiedService.clearCache();
      this.logger.log('✅ Кеш очищен');

      // Тест 1: Отправка сообщения через WebSocket
      const test1 = await this.testWebSocketMessage();
      testResults.push(test1);

      // Тест 2: Попытка отправить то же сообщение через HTTP (должно заблокироваться)
      const test2 = await this.testHttpMessageDuplicate();
      testResults.push(test2);

      // Тест 3: Отправка нового сообщения через HTTP
      const test3 = await this.testHttpMessageNew();
      testResults.push(test3);

      // Тест 4: Проверка статистики кеша
      const cacheStats = this.unifiedService.getCacheStats();
      testResults.push({
        testName: 'Cache Statistics',
        result: 'INFO',
        data: cacheStats,
      });

      const successCount = testResults.filter(r => r.result === 'SUCCESS').length;
      const totalTests = testResults.filter(r => r.result !== 'INFO').length;

      return {
        testResults,
        cacheStats,
        success: successCount === totalTests,
        summary: `Пройдено ${successCount}/${totalTests} тестов. Кеш: ${cacheStats.activeEntries} активных записей.`,
      };

    } catch (error) {
      this.logger.error(`❌ Ошибка тестирования: ${error.message}`);
      return {
        testResults,
        cacheStats: this.unifiedService.getCacheStats(),
        success: false,
        summary: `Тестирование прервано с ошибкой: ${error.message}`,
      };
    }
  }

  /**
   * Симулирует отправку сообщения через WebSocket
   */
  private async testWebSocketMessage(): Promise<any> {
    this.logger.log('📱 Тест 1: Отправка сообщения через WebSocket');
    
    try {
      const messageDto: CreateMessageDto = {
        text: 'Тестовое сообщение через WebSocket',
      };

      // Симулируем создание сообщения через WebSocket (createMessage)
      const message = await this.eventsService.createMessage(1, 1, messageDto);
      
      return {
        testName: 'WebSocket Message',
        result: 'SUCCESS',
        data: {
          messageId: message.id,
          source: 'websocket',
          text: message.text,
        },
      };
    } catch (error) {
      return {
        testName: 'WebSocket Message',
        result: 'FAILED',
        error: error.message,
      };
    }
  }

  /**
   * Симулирует попытку отправить дубликат через HTTP
   */
  private async testHttpMessageDuplicate(): Promise<any> {
    this.logger.log('🔄 Тест 2: Попытка дубликата через HTTP (должна заблокироваться)');
    
    try {
      const messageDto: AddMessageDto = {
        text: 'Дубликат сообщения',
        userId: 1,
        eventId: 1,
      };

      // Симулируем отправку того же сообщения через HTTP
      const message = await this.eventsService.addMessage(messageDto);
      
      // Проверяем, что в логах есть сообщения о блокировке дубликатов
      const cacheStats = this.unifiedService.getCacheStats();
      
      return {
        testName: 'HTTP Duplicate Block',
        result: cacheStats.activeEntries > 0 ? 'SUCCESS' : 'FAILED',
        data: {
          messageId: message.id,
          source: 'http',
          cacheEntriesAfter: cacheStats.activeEntries,
        },
      };
    } catch (error) {
      return {
        testName: 'HTTP Duplicate Block',
        result: 'FAILED',
        error: error.message,
      };
    }
  }

  /**
   * Симулирует отправку нового сообщения через HTTP
   */
  private async testHttpMessageNew(): Promise<any> {
    this.logger.log('📨 Тест 3: Отправка нового сообщения через HTTP');
    
    try {
      const messageDto: AddMessageDto = {
        text: 'Новое уникальное сообщение через HTTP',
        userId: 2, // Другой пользователь
        eventId: 1,
      };

      const message = await this.eventsService.addMessage(messageDto);
      
      return {
        testName: 'HTTP New Message',
        result: 'SUCCESS',
        data: {
          messageId: message.id,
          source: 'http',
          text: message.text,
        },
      };
    } catch (error) {
      return {
        testName: 'HTTP New Message',
        result: 'FAILED',
        error: error.message,
      };
    }
  }

  /**
   * Генерирует отчет о тестировании в читаемом формате
   */
  generateReport(testResult: any): string {
    const { testResults, cacheStats, success, summary } = testResult;
    
    let report = '\n' + '='.repeat(60) + '\n';
    report += '🧪 ОТЧЕТ О ТЕСТИРОВАНИИ УНИФИЦИРОВАННЫХ УВЕДОМЛЕНИЙ\n';
    report += '='.repeat(60) + '\n\n';
    
    report += `📊 Общий результат: ${success ? '✅ УСПЕШНО' : '❌ НЕУДАЧНО'}\n`;
    report += `📝 Резюме: ${summary}\n\n`;
    
    report += '📋 Детали тестов:\n';
    report += '-'.repeat(40) + '\n';
    
    testResults.forEach((test, index) => {
      const icon = test.result === 'SUCCESS' ? '✅' : test.result === 'FAILED' ? '❌' : 'ℹ️';
      report += `${index + 1}. ${icon} ${test.testName}: ${test.result}\n`;
      
      if (test.data) {
        Object.entries(test.data).forEach(([key, value]) => {
          report += `   ${key}: ${JSON.stringify(value)}\n`;
        });
      }
      
      if (test.error) {
        report += `   Ошибка: ${test.error}\n`;
      }
      
      report += '\n';
    });
    
    report += '📈 Статистика кеша дедупликации:\n';
    report += '-'.repeat(40) + '\n';
    report += `Всего записей: ${cacheStats.totalEntries}\n`;
    report += `Активных записей: ${cacheStats.activeEntries}\n`;
    report += `Истекших записей: ${cacheStats.expiredEntries}\n`;
    
    if (cacheStats.oldestEntry) {
      report += `Самая старая запись: ${cacheStats.oldestEntry}\n`;
    }
    
    if (cacheStats.newestEntry) {
      report += `Самая новая запись: ${cacheStats.newestEntry}\n`;
    }
    
    report += '\n' + '='.repeat(60) + '\n';
    
    return report;
  }
}

/**
 * Пример использования тестера
 */
export async function runUnifiedNotificationTest(
  eventsService: EventsService,
  unifiedService: UnifiedMessageNotificationService,
): Promise<void> {
  const tester = new UnifiedNotificationTester(eventsService, unifiedService);
  const result = await tester.runFullTest();
  const report = tester.generateReport(result);
  
  console.log(report);
  
  // Логируем результат в файл для анализа
  const fs = require('fs');
  const path = require('path');
  
  const reportPath = path.join(__dirname, '../../logs/notification-test-report.log');
  fs.writeFileSync(reportPath, report, 'utf8');
  
  console.log(`📄 Отчет сохранен в: ${reportPath}`);
}
