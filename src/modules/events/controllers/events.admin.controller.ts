import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { EventsService } from '../events.service';
import { GetEventsAdminDto } from '../dto/get-events-admin.dto';
import { EventsPaginatedAdminDto } from '../dto/events-paginated-admin.dto';
import { EventDto } from '../dto/event.dto';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserId } from '../../../common/decorators/user-id.decorator';

@ApiTags('События (Админ)')
@Controller('admin/events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class EventsAdminController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Получить список событий с фильтрами и пагинацией',
    description: 'Возвращает все события (включая завершенные) с возможностью фильтрации по статусу, типу, сообществу и другим параметрам.'
  })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'COMPLETED'], description: 'Фильтр по статусу события' })
  @ApiResponse({
    status: 200,
    description: 'Список событий',
    type: EventsPaginatedAdminDto,
  })
  async getEvents(
    @Query() query: GetEventsAdminDto,
  ): Promise<EventsPaginatedAdminDto> {
    return this.eventsService.findAllEventsForAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить событие по ID' })
  @ApiResponse({ status: 200, description: 'Событие', type: EventDto })
  async getEventById(@Param('id', ParseIntPipe) id: number): Promise<EventDto> {
    return await this.eventsService.getEventByIdForAdmin(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать событие' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  @ApiBody({ description: 'Данные для создания события', type: CreateEventDto })
  @ApiResponse({ status: 201, description: 'Событие создано', type: EventDto })
  async createEvent(
    @UserId() adminId: number,
    @Body() dto: CreateEventDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<EventDto> {
    return this.eventsService.createEventByAdmin(adminId, dto, image);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Обновить событие',
    description: 'Обновляет данные события. Завершенные события (статус COMPLETED) нельзя редактировать.'
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  @ApiBody({
    description: 'Данные для обновления события',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Название мероприятия' },
        description: { type: 'string', description: 'Описание' },
        latitude: {
          type: 'string',
          description: 'Широта (число в виде строки)',
        },
        longitude: {
          type: 'string',
          description: 'Долгота (число в виде строки)',
        },
        categoryId: {
          type: 'string',
          description: 'ID категории (число в виде строки, обязательно)',
        },
        communityId: {
          type: 'string',
          description: 'ID сообщества (число в виде строки, необязательно)',
        },
        type: {
          type: 'string',
          description: 'Тип события (EVENT или NOTIFICATION)',
        },
        hasVoting: {
          type: 'string',
          description: 'Нужно ли голосование (true/false в виде строки)',
        },
        votingQuestion: {
          type: 'string',
          description: 'Вопрос для голосования',
        },
        votingOptions: {
          type: 'string',
          description:
            'Варианты ответов (строки через запятую, например: "Да,Нет,Возможно")',
        },
        hasMoneyCollection: {
          type: 'string',
          description: 'Нужен ли сбор денег (true/false в виде строки)',
        },
        moneyAmount: {
          type: 'string',
          description: 'Сумма сбора (число в виде строки)',
        },
        eventDateTime: {
          type: 'string',
          format: 'date-time',
          description: 'Дата и время проведения мероприятия (ISO 8601)',
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Картинка мероприятия',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Событие обновлено',
    type: EventDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Нельзя редактировать завершенное событие',
  })
  @ApiResponse({
    status: 404,
    description: 'Событие не найдено',
  })
  async updateEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<EventDto> {
    return this.eventsService.updateEventByAdmin(id, dto, image);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить событие' })
  @ApiResponse({ status: 200, description: 'Событие удалено' })
  async deleteEvent(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.eventsService.deleteEventByAdmin(id);
  }

  @Post('test-cleanup')
  @ApiOperation({ summary: 'Тест очистки истекших уведомлений' })
  @ApiResponse({ status: 200, description: 'Очистка выполнена' })
  async testCleanup(): Promise<{ message: string }> {
    await this.eventsService.cleanupExpiredNotifications();
    return { message: 'Очистка истекших уведомлений выполнена' };
  }
}
