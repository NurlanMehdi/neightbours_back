import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Сервис для работы с Prisma ORM.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  /**
   * Инициализация подключения к базе данных.
   */
  async onModuleInit() {
    this.logger.log('Подключение к базе данных...');
    await this.$connect();
    this.logger.log('Подключение к базе данных установлено.');
  }

  /**
   * Закрытие подключения к базе данных.
   */
  async onModuleDestroy() {
    this.logger.log('Закрытие подключения к базе данных...');
    await this.$disconnect();
    this.logger.log('Подключение к базе данных закрыто.');
  }
}
