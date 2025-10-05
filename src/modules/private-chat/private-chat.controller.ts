import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  HttpException,
  HttpCode,
  Delete,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserId } from '../../common/decorators/user-id.decorator';
import { PrivateChatService } from './private-chat.service';
import {
  CreateConversationDto,
  MarkMessagesReadDto,
  SearchMessagesDto,
  SendPrivateMessageDto,
  ReplyMessageDto,
  SuccessResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Private Chat')
@ApiBearerAuth()
@Controller('private-chat')
@UseGuards(JwtAuthGuard)
export class PrivateChatController {
  constructor(private readonly service: PrivateChatService) {}

  @Get('conversations')
  @ApiOperation({
    summary:
      'Список диалогов с последним сообщением и количеством непрочитанных',
  })
  @ApiResponse({ status: 200, description: 'Список диалогов успешно получен' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  async getConversations(@UserId() userId: number) {
    return this.service.getConversationList(userId);
  }

  @Get('conversations/:receiverId/messages')
  @ApiOperation({
    summary: 'Получить сообщения диалога с конкретным пользователем',
    description:
      'Возвращает сообщения приватного диалога между текущим пользователем и указанным получателем. Использует pairKey для поиска диалога. Включает статус прочтения каждого сообщения.',
  })
  @ApiResponse({ status: 200, description: 'Сообщения успешно получены' })
  @ApiResponse({
    status: 400,
    description: 'Некорректный receiverId или попытка получить сообщения с самим собой',
  })
  @ApiResponse({ status: 403, description: 'Нет доступа к диалогу' })
  @ApiResponse({ status: 404, description: 'Получатель не найден' })
  async getMessages(
    @UserId() userId: number,
    @Param('receiverId', ParseIntPipe) receiverId: number,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 50,
  ) {
    return this.service.getMessages(userId, receiverId, page, limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Поиск по тексту среди личных сообщений' })
  @ApiResponse({ status: 200, description: 'Результаты поиска' })
  @ApiResponse({ status: 400, description: 'Некорректный запрос' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  async search(@UserId() userId: number, @Query() query: SearchMessagesDto) {
    return this.service.searchMessages(
      userId,
      query.q,
      query.page,
      query.limit,
    );
  }

  @Post('messages/:id/reply')
  @ApiOperation({ summary: 'Ответ на конкретное сообщение' })
  @ApiResponse({ status: 201, description: 'Ответ успешно отправлен' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 403, description: 'Нет доступа к диалогу' })
  @ApiResponse({ status: 404, description: 'Сообщение или диалог не найден' })
  async reply(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReplyMessageDto,
  ) {
    return this.service.replyToMessage(userId, id, dto.text);
  }

  @Post('messages')
  @ApiOperation({
    summary: 'Отправить приватное сообщение',
    description:
      'Отправляет приватное сообщение. Поведение зависит от глобальных настроек чата: если приватные чаты отключены, возвращает 403 Forbidden.',
  })
  @ApiResponse({ status: 201, description: 'Сообщение успешно отправлено' })
  @ApiResponse({
    status: 400,
    description: 'Некорректные данные или сообщение слишком длинное',
  })
  @ApiResponse({
    status: 403,
    description:
      'Нет доступа к диалогу или приватные чаты отключены администратором',
  })
  @ApiResponse({ status: 404, description: 'Диалог или получатель не найден' })
  async sendMessage(
    @UserId() userId: number,
    @Body() dto: SendPrivateMessageDto,
  ) {
    return this.service.sendMessage(userId, dto);
  }

  @Post('conversations/:id/read')
  @ApiOperation({ summary: 'Отметить сообщения в диалоге как прочитанные' })
  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'Отметка успешно применена' })
  @ApiResponse({ status: 403, description: 'Нет доступа к диалогу' })
  @ApiResponse({ status: 404, description: 'Диалог не найден' })
  async markRead(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<MarkMessagesReadDto>,
  ) {
    try {
      return await this.service.markAsRead(userId, id, dto.upToMessageId);
    } catch (e: any) {
      if (e instanceof HttpException) throw e;
      return { updated: 0, readAt: new Date() };
    }
  }

  @Post('conversations')
  @ApiOperation({
    summary: 'Создать приватный диалог (или вернуть существующий)',
    description:
      'Создает новый приватный диалог или возвращает существующий. Поведение зависит от глобальных настроек чата: если приватные чаты отключены, возвращает 403 Forbidden.',
  })
  @ApiResponse({
    status: 201,
    description: 'Диалог создан или возвращен существующий',
  })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({
    status: 403,
    description:
      'Нельзя создать диалог с самим собой или приватные чаты отключены администратором',
  })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async createConversation(
    @UserId() userId: number,
    @Body() dto: CreateConversationDto,
  ) {
    try {
      return await this.service.createConversation(userId, dto.receiverId);
    } catch (e: any) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException('Не удалось создать диалог');
    }
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Удалить приватный диалог' })
  @ApiResponse({
    status: 200,
    description: 'Диалог удален',
    type: SuccessResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Нет доступа к диалогу' })
  @ApiResponse({ status: 404, description: 'Диалог не найден' })
  async deleteConversation(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.service.deleteConversation(userId, id);
    return { success: true };
  }

  @Delete('messages/:id')
  @ApiOperation({ summary: 'Удалить сообщение' })
  @ApiResponse({
    status: 200,
    description: 'Сообщение удалено',
    type: SuccessResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Нет доступа к удалению' })
  @ApiResponse({ status: 404, description: 'Сообщение не найдено' })
  async deleteMessage(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.service.deleteMessage(userId, id);
    return { success: true };
  }

  @Post(':conversationId/read')
  @ApiOperation({ summary: 'Отметить диалог как прочитанный' })
  @ApiResponse({
    status: 200,
    description: 'Диалог успешно отмечен как прочитанный',
  })
  @ApiResponse({
    status: 404,
    description: 'Диалог не найден',
  })
  @ApiResponse({
    status: 403,
    description: 'Пользователь не является участником диалога',
  })
  async markConversationAsRead(
    @UserId() userId: number,
    @Param('conversationId', ParseIntPipe) conversationId: number,
  ): Promise<{ success: boolean }> {
    await this.service.markConversationAsRead(userId, conversationId);
    return { success: true };
  }
}
