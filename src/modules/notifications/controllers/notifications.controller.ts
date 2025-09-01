import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { UserId } from '../../../common/decorators/user-id.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { NotificationService } from '../services/notification.service';
import {
  GetNotificationsDto,
  NotificationsPaginatedDto,
  NotificationDto,
  UnreadCountDto,
  CreateNotificationDto,
} from '../dto';

/**
 * Контроллер для управления уведомлениями пользователя
 */
@ApiTags('Уведомления')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Получение списка уведомлений текущего пользователя
   */
  @Get()
  @ApiOperation({
    summary: 'Получить список уведомлений',
    description: 'Получает список уведомлений текущего пользователя с возможностью фильтрации и пагинации',
  })
  @ApiResponse({
    status: 200,
    description: 'Список уведомлений успешно получен',
    type: NotificationsPaginatedDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Пользователь не авторизован',
  })
  async getUserNotifications(
    @UserId() userId: number,
    @Query() query: GetNotificationsDto,
  ): Promise<NotificationsPaginatedDto> {
    const filters = {
      ...query,
      userId,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
    };

    return this.notificationService.getUserNotifications(filters);
  }

  /**
   * Получение количества непрочитанных уведомлений
   */
  @Get('unread-count')
  @ApiOperation({
    summary: 'Получить количество непрочитанных уведомлений',
    description: 'Возвращает количество непрочитанных уведомлений текущего пользователя',
  })
  @ApiResponse({
    status: 200,
    description: 'Количество непрочитанных уведомлений',
    type: UnreadCountDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Пользователь не авторизован',
  })
  async getUnreadCount(@UserId() userId: number): Promise<UnreadCountDto> {
    return this.notificationService.getUnreadCount(userId);
  }



  /**
   * Отметка уведомления как прочитанного
   */
  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Отметить уведомление как прочитанное',
    description: 'Отмечает указанное уведомление как прочитанное',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID уведомления',
  })
  @ApiResponse({
    status: 204,
    description: 'Уведомление отмечено как прочитанное',
  })
  @ApiResponse({
    status: 401,
    description: 'Пользователь не авторизован',
  })
  @ApiResponse({
    status: 403,
    description: 'Нет доступа к данному уведомлению',
  })
  @ApiResponse({
    status: 404,
    description: 'Уведомление не найдено',
  })
  async markAsRead(
    @Param('id', ParseIntPipe) notificationId: number,
    @UserId() userId: number,
  ): Promise<void> {
    await this.notificationService.markAsRead(notificationId, userId);
  }

  /**
   * Отметка всех уведомлений как прочитанных
   */
  @Patch('mark-all-read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Отметить все уведомления как прочитанные',
    description: 'Отмечает все уведомления пользователя как прочитанные',
  })
  @ApiResponse({
    status: 204,
    description: 'Все уведомления отмечены как прочитанные',
  })
  @ApiResponse({
    status: 401,
    description: 'Пользователь не авторизован',
  })
  async markAllAsRead(@UserId() userId: number): Promise<void> {
    await this.notificationService.markAllAsRead(userId);
  }

  /**
   * Удаление уведомления
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Удалить уведомление',
    description: 'Удаляет указанное уведомление пользователя',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID уведомления',
  })
  @ApiResponse({
    status: 204,
    description: 'Уведомление удалено',
  })
  @ApiResponse({
    status: 401,
    description: 'Пользователь не авторизован',
  })
  @ApiResponse({
    status: 403,
    description: 'Нет доступа к данному уведомлению',
  })
  @ApiResponse({
    status: 404,
    description: 'Уведомление не найдено',
  })
  async deleteNotification(
    @Param('id', ParseIntPipe) notificationId: number,
    @UserId() userId: number,
  ): Promise<void> {
    await this.notificationService.deleteNotification(notificationId, userId);
  }

  /**
   * Создание нового уведомления
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Создать новое уведомление',
    description: 'Создает новое уведомление для указанного пользователя. Доступно только администраторам.',
  })
  @ApiResponse({
    status: 201,
    description: 'Уведомление успешно создано',
    type: NotificationDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные данные запроса',
  })
  @ApiResponse({
    status: 401,
    description: 'Пользователь не авторизован',
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав доступа',
  })
  async createNotification(
    @Body(ValidationPipe) createNotificationDto: CreateNotificationDto,
  ): Promise<NotificationDto> {
    return this.notificationService.createNotification(createNotificationDto);
  }


}
