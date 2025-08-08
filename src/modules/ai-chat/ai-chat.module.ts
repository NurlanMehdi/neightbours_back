import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AiChatController } from './controllers/ai-chat.controller';
import { AiChatService } from './services/ai-chat.service';
import { AiApiService } from './services/ai-api.service';
import { AiChatRepository } from './repositories/ai-chat.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 60000, // 60 секунд таймаут для HTTP запросов
      maxRedirects: 5,
    }),
    ConfigModule,
    PrismaModule,
  ],
  controllers: [AiChatController],
  providers: [
    AiChatService,
    AiApiService,
    AiChatRepository,
  ],
  exports: [AiChatService, AiApiService],
})
export class AiChatModule {} 