import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
  Put,
  Body,
  ValidationPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { ChatAdminService } from './chat-admin.service';
import { UnifiedCommunitiesResponseDto } from './dto/unified-community.dto';
import { MessagesQueryDto } from './dto/messages-query.dto';
import { ModerationMessagesResponseDto } from './dto/moderation-message.dto';
import { UpdateGlobalChatSettingsDto } from './dto/update-global-chat-settings.dto';
import { GlobalChatSettingsResponseDto } from './dto/global-chat-settings-response.dto';
import { DeleteMessageDto } from './dto/delete-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ChatCleanupService } from './services/chat-cleanup.service';

@ApiTags('Admin Chat Moderation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class ChatAdminController {
  constructor(
    private readonly service: ChatAdminService,
    private readonly cleanupService: ChatCleanupService,
  ) {}

  @Get('chats/communities')
  @ApiOperation({
    summary:
      'Унифицированный список сообществ и событий для выпадающих списков (админ)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Номер страницы',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 100,
    description: 'Количество элементов на странице',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['COMMUNITY', 'EVENT'],
    description: 'Фильтр по типу (COMMUNITY или EVENT)',
  })
  @ApiResponse({ status: 200, type: UnifiedCommunitiesResponseDto })
  async getUnifiedCommunities(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: 'COMMUNITY' | 'EVENT',
  ): Promise<UnifiedCommunitiesResponseDto> {
    return this.service.getUnifiedCommunitiesList({ page, limit, type });
  }

  @Get('chats/messages')
  @ApiOperation({ summary: 'Список сообщений для модерации (админ)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Номер страницы',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
    description: 'Количество элементов на странице',
  })
  @ApiQuery({
    name: 'chatType',
    required: true,
    enum: ['COMMUNITY', 'EVENT'],
    description: 'Тип чата (обязательный)',
  })
  @ApiQuery({
    name: 'chatId',
    required: true,
    type: Number,
    example: 1,
    description: 'ID чата (communityId или eventId) (обязательный)',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: Number,
    example: 1,
    description: 'Фильтр по ID пользователя-автора',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    example: 'текст сообщения',
    description: 'Поиск по тексту сообщения',
  })
  @ApiResponse({ status: 200, type: ModerationMessagesResponseDto })
  async getModerationMessages(
    @Query() query: MessagesQueryDto,
  ): Promise<ModerationMessagesResponseDto> {
    const res = await this.service.getModerationMessages(query);
    return res as any;
  }

  // 4) Delete (soft) message
  @Delete('chats/messages/:id')
  @ApiOperation({ summary: 'Мягкое удаление сообщения (админ)' })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'ID сообщения для удаления',
  })
  @ApiQuery({
    name: 'chatType',
    required: false,
    enum: ['COMMUNITY', 'EVENT'],
    description: 'Тип чата (COMMUNITY или EVENT)',
  })
  @ApiResponse({
    status: 200,
    description: 'Помечено как удалённое',
    schema: {
      type: 'object',
      properties: { success: { type: 'boolean' }, id: { type: 'number' } },
    },
  })
  async softDelete(
    @Param() params: DeleteMessageDto,
    @Query('chatType') chatType?: 'COMMUNITY' | 'EVENT',
  ) {
    return this.service.softDeleteMessage(params.id, chatType);
  }

  @Post('chats/messages/:id/approve')
  @ApiOperation({ summary: 'Одобрить сообщение для модерации (админ)' })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'ID сообщения для одобрения',
  })
  @ApiResponse({ status: 200, description: 'Сообщение одобрено' })
  async approveMessage(@Param() params: DeleteMessageDto) {
    await this.service.approveMessage(params.id);
    return { success: true };
  }

  @Post('chats/messages/:id/reject')
  @ApiOperation({ summary: 'Отклонить сообщение для модерации (админ)' })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'ID сообщения для отклонения',
  })
  @ApiResponse({ status: 200, description: 'Сообщение отклонено' })
  async rejectMessage(@Param() params: DeleteMessageDto) {
    await this.service.rejectMessage(params.id);
    return { success: true };
  }

  // 5) Global Chat Settings
  @Get('global-chat-settings')
  @ApiOperation({ summary: 'Получить глобальные настройки чата (админ)' })
  @ApiResponse({ status: 200, type: GlobalChatSettingsResponseDto })
  async getGlobalChatSettings(): Promise<GlobalChatSettingsResponseDto> {
    return this.service.getGlobalChatSettings();
  }

  @Put('global-chat-settings')
  @ApiOperation({ summary: 'Обновить глобальные настройки чата (админ)' })
  @ApiBody({
    type: UpdateGlobalChatSettingsDto,
    description: 'Плоский формат тела запроса',
  })
  @ApiResponse({ status: 200, type: GlobalChatSettingsResponseDto })
  async updateGlobalChatSettings(
    @Body() body: any,
  ): Promise<GlobalChatSettingsResponseDto> {
    // Accept both flat JSON and nested { globalSettings: { ... } }
    const payload = body?.globalSettings ?? body;

    // Validate the flattened payload against UpdateGlobalChatSettingsDto
    const validatedDto = await new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }).transform(payload, {
      type: 'body',
      metatype: UpdateGlobalChatSettingsDto as any,
    });

    return this.service.updateGlobalChatSettings(
      validatedDto as UpdateGlobalChatSettingsDto,
    );
  }

  @Post('cleanup-messages')
  @ApiOperation({ summary: 'Ручная очистка старых сообщений (админ)' })
  @ApiQuery({
    name: 'retentionDays',
    required: false,
    type: Number,
    example: 30,
    description:
      'Количество дней хранения (если не указано, используется настройка из глобальных настроек)',
  })
  @ApiResponse({
    status: 200,
    description: 'Очистка выполнена',
    schema: { type: 'object', properties: { deleted: { type: 'number' } } },
  })
  async cleanupMessages(@Query('retentionDays') retentionDays?: number) {
    const result =
      await this.cleanupService.cleanupMessagesManually(retentionDays);
    return result;
  }
}
