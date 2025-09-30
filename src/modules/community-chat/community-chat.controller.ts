import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UserId } from '../../common/decorators/user-id.decorator';
import { CommunityChatService } from './community-chat.service';
import { SendCommunityMessageDto } from './dto/send-message.dto';
import { PaginationQueryDto } from './dto/pagination.dto';
import { SearchMessagesDto } from './dto/search.dto';
import { CreateCommunityConversationDto } from './dto/create-conversation.dto';
import { UpdateCommunityChatSettingsDto } from './dto/update-settings.dto';
import { MarkCommunityReadDto } from './dto/mark-read.dto';
import { MarkCommunityMessagesReadDto } from './dto/mark-community-messages-read.dto';
import { UnreadCommunityMessagesResponseDto } from './dto/unread-community-messages.dto';

@ApiTags('Community Chat')
@ApiBearerAuth()
@Controller('communities')
@UseGuards(JwtAuthGuard)
export class CommunityChatController {
  constructor(private readonly service: CommunityChatService) {}

  @Post(':id/messages')
  @ApiOperation({ summary: 'Отправить сообщение в чат сообщества' })
  @ApiResponse({ status: 201, description: 'Сообщение отправлено' })
  async sendMessage(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) communityId: number,
    @Body() dto: SendCommunityMessageDto,
  ) {
    return this.service.sendMessage(userId, communityId, dto);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Получить сообщения чата сообщества' })
  @ApiResponse({ status: 200, description: 'Список сообщений' })
  async list(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) communityId: number,
    @Query() query: PaginationQueryDto,
  ) {
    const { page = 1, limit = 50 } = query;
    return this.service.getMessages(userId, communityId, page, limit);
  }

  @Delete(':communityId/messages/:messageId')
  @ApiOperation({ summary: 'Удалить сообщение (админ или автор)' })
  @ApiResponse({ status: 200, description: 'Удалено' })
  async deleteMessage(
    @UserId() userId: number,
    @Param('communityId', ParseIntPipe) communityId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
  ) {
    await this.service.deleteMessage(userId, communityId, messageId);
    return { success: true };
  }

  @Post(':communityId/messages/:messageId/read')
  @ApiOperation({ summary: 'Отметить сообщения как прочитанные' })
  @ApiResponse({ status: 200, description: 'Отмечено' })
  @HttpCode(200)
  async markRead(
    @UserId() userId: number,
    @Param('communityId', ParseIntPipe) communityId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body() dto: MarkCommunityReadDto,
  ) {
    const upTo = dto.upToMessageId ?? messageId;
    return this.service.markAsRead(userId, communityId, upTo);
  }

  @Get(':id/messages/search')
  @ApiOperation({ summary: 'Поиск сообщений в рамках сообщества' })
  @ApiResponse({ status: 200, description: 'Результаты поиска' })
  async searchInCommunity(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) communityId: number,
    @Query() query: PaginationQueryDto & SearchMessagesDto,
  ) {
    const { page = 1, limit = 50, query: q } = query as any;
    return this.service.search(userId, q, communityId, page, limit);
  }

  // Эндпоинт создания чата отключен: чат создается автоматически при первом сообщении

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Удалить чат сообщества (админ)' })
  @ApiResponse({ status: 200, description: 'Чат удален' })
  async deleteConversation(
    @UserId() adminId: number,
    @Param('id', ParseIntPipe) communityId: number,
  ) {
    await this.service.deleteConversation(adminId, communityId);
    return { success: true };
  }

  @Patch(':id/settings')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Обновить настройки чата (админ)' })
  @ApiResponse({ status: 200, description: 'Настройки обновлены' })
  async updateSettings(
    @UserId() adminId: number,
    @Param('id', ParseIntPipe) communityId: number,
    @Body() dto: UpdateCommunityChatSettingsDto,
  ) {
    return this.service.updateSettings(adminId, communityId, dto);
  }

  @Post('messages/read')
  @ApiOperation({ summary: 'Отметить все сообщения сообщества как прочитанные' })
  @ApiResponse({
    status: 200,
    description: 'Сообщения успешно отмечены как прочитанные',
  })
  @ApiResponse({
    status: 404,
    description: 'Сообщество не найдено',
  })
  @ApiResponse({
    status: 403,
    description: 'Пользователь не является членом сообщества',
  })
  @HttpCode(200)
  async markCommunityMessagesAsRead(
    @Body() dto: MarkCommunityMessagesReadDto,
  ): Promise<{ success: boolean }> {
    await this.service.markCommunityMessagesAsRead(dto.communityId, dto.userId);
    return { success: true };
  }

  @Get('messages/unread')
  @ApiOperation({ summary: 'Получить непрочитанные сообщения по сообществам' })
  @ApiResponse({
    status: 200,
    description: 'Группированные непрочитанные сообщения по сообществам',
    type: UnreadCommunityMessagesResponseDto,
    schema: {
      type: 'object',
      properties: {
        count: {
          type: 'object',
          description:
            'Объект с количеством непрочитанных сообщений по сообществам',
          additionalProperties: {
            type: 'number',
            description: 'Количество непрочитанных сообщений для сообщества',
          },
          example: { '1': 12, '5': 7 },
        },
        COMMUNITY: {
          type: 'number',
          description:
            'Общее количество непрочитанных сообщений во всех сообществах',
          example: 19,
        },
      },
      example: {
        count: {
          '1': 12,
          '5': 7,
        },
        COMMUNITY: 19,
      },
    },
  })
  async getUnreadMessages(
    @UserId() userId: number,
  ): Promise<UnreadCommunityMessagesResponseDto> {
    return this.service.getUnreadCountsForUser(userId);
  }
}
