import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserId } from '../../common/decorators/user-id.decorator';
import { GetEventsDto } from './dto/get-events.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventDto, EventsListDto } from './dto/event.dto';
import { VoteDto, VoteResponseDto } from './dto/vote.dto';
import { VotingResultsDto } from './dto/voting-results.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { MarkEventReadDto } from './dto/mark-event-read.dto';
import { IEvent, IEventsList } from './interfaces/event.interface';
import { UnreadMessagesResponseDto } from './dto/unread-messages.dto';
import { EventMessageDto } from './dto/message.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('События')
@Controller('events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать мероприятие' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  @ApiResponse({
    status: 201,
    description: 'Мероприятие успешно создано',
    type: EventDto,
  })
  @ApiBody({
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
        type: {
          type: 'string',
          description: 'Тип события (EVENT или NOTIFICATION)',
        },
        communityId: {
          type: 'string',
          description: 'ID сообщества (число в виде строки)',
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
      required: [
        'title',
        'latitude',
        'longitude',
        'categoryId',
        'type',
        'communityId',
      ],
    },
  })
  async create(
    @UserId() userId: number,
    @Body() createEventDto: CreateEventDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<IEvent> {
    return this.eventsService.createEvent(userId, createEventDto, image);
  }

  @Get('community/:communityId')
  @ApiOperation({ summary: 'Получить все события сообщества' })
  @ApiResponse({
    status: 200,
    description: 'Список событий сообщества',
    type: EventsListDto,
  })
  async getCommunityEvents(
    @Param('communityId') communityId: string,
    @Query() filters: GetEventsDto,
  ): Promise<IEventsList> {
    return this.eventsService.getCommunityEvents(+communityId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить событие по ID' })
  @ApiResponse({
    status: 200,
    description: 'Событие найдено',
    type: EventDto,
  })
  async getEventById(@Param('id') id: string): Promise<IEvent> {
    return this.eventsService.getEventById(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить событие' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  @ApiResponse({
    status: 200,
    description: 'Событие успешно обновлено',
    type: EventDto,
  })
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
  async update(
    @UserId() userId: number,
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<IEvent> {
    return this.eventsService.updateEvent(userId, +id, updateEventDto, image);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить событие' })
  remove(@UserId() userId: number, @Param('id') id: string) {
    return this.eventsService.deleteEvent(userId, +id);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Присоединиться к событию' })
  @ApiResponse({
    status: 200,
    description: 'Успешно присоединились к событию',
    type: EventDto,
  })
  async joinEvent(
    @UserId() userId: number,
    @Param('id') id: string,
  ): Promise<IEvent> {
    return this.eventsService.joinEvent(userId, +id);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Покинуть событие' })
  @ApiResponse({
    status: 200,
    description: 'Успешно покинули событие',
    type: EventDto,
  })
  async leaveEvent(
    @UserId() userId: number,
    @Param('id') id: string,
  ): Promise<IEvent> {
    return this.eventsService.leaveEvent(userId, +id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Получить сообщения мероприятия' })
  @ApiResponse({
    status: 200,
    description: 'Список сообщений мероприятия',
    type: EventMessageDto,
    isArray: true,
  })
  @ApiResponse({
    status: 403,
    description: 'Пользователь не является участником мероприятия',
  })
  @ApiResponse({
    status: 404,
    description: 'Мероприятие не найдено',
  })
  async getEventMessages(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 50,
  ) {
    return this.eventsService.getEventMessages(id, userId, page, limit);
  }

  @Post(':id/messages')
  @ApiOperation({ 
    summary: 'Отправить сообщение в мероприятие',
    description: 'Отправляет сообщение в чат мероприятия. Поведение зависит от глобальных настроек чата: если чаты событий отключены, возвращает 403 Forbidden. Если включена модерация, сообщение будет ожидать одобрения администратора.'
  })
  @ApiResponse({
    status: 201,
    description: 'Сообщение успешно отправлено',
    type: EventMessageDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные данные сообщения или сообщение слишком длинное',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  @ApiResponse({
    status: 403,
    description: 'Пользователь не является участником мероприятия или чаты событий отключены администратором',
  })
  @ApiResponse({
    status: 404,
    description: 'Мероприятие не найдено',
  })
  async createMessage(
    @UserId() userId: number,
    @Param('id') eventId: string,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.eventsService.createMessage(userId, +eventId, createMessageDto);
  }

  @Post(':id/vote')
  @ApiOperation({ summary: 'Проголосовать в мероприятии' })
  @ApiResponse({
    status: 201,
    description: 'Голос успешно засчитан',
    type: VoteResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Пользователь уже проголосовал или мероприятие не содержит голосования',
  })
  @ApiResponse({
    status: 403,
    description: 'Пользователь не является участником мероприятия',
  })
  @ApiResponse({
    status: 404,
    description: 'Вариант ответа не найден',
  })
  async voteInEvent(
    @UserId() userId: number,
    @Param('id') eventId: string,
    @Body() voteDto: VoteDto,
  ): Promise<VoteResponseDto> {
    return this.eventsService.voteInEvent(userId, +eventId, voteDto);
  }

  @Delete(':id/vote')
  @ApiOperation({ summary: 'Отменить голос в мероприятии' })
  @ApiResponse({
    status: 200,
    description: 'Голос успешно отменен',
  })
  @ApiResponse({
    status: 400,
    description:
      'Пользователь не голосовал или мероприятие не содержит голосования',
  })
  @ApiResponse({
    status: 403,
    description: 'Пользователь не является участником мероприятия',
  })
  async cancelVoteInEvent(
    @UserId() userId: number,
    @Param('id') eventId: string,
  ): Promise<void> {
    return this.eventsService.cancelVoteInEvent(userId, +eventId);
  }

  @Get(':id/voting-results')
  @ApiOperation({ summary: 'Получить результаты голосования в мероприятии' })
  @ApiResponse({
    status: 200,
    description: 'Результаты голосования',
    type: VotingResultsDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Мероприятие не содержит голосования',
  })
  @ApiResponse({
    status: 403,
    description: 'Пользователь не является членом сообщества',
  })
  async getVotingResults(
    @UserId() userId: number,
    @Param('id') eventId: string,
  ): Promise<VotingResultsDto> {
    return this.eventsService.getVotingResults(+eventId, userId);
  }

  @Get(':id/voting-options')
  @ApiOperation({
    summary: 'Получить варианты ответов для голосования в мероприятии',
  })
  @ApiResponse({
    status: 200,
    description: 'Варианты ответов для голосования',
  })
  @ApiResponse({
    status: 400,
    description: 'Мероприятие не содержит голосования',
  })
  @ApiResponse({
    status: 403,
    description: 'Пользователь не является участником мероприятия',
  })
  async getVotingOptions(
    @UserId() userId: number,
    @Param('id') eventId: string,
  ): Promise<any[]> {
    return this.eventsService.getVotingOptions(+eventId, userId);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Добавить новое сообщение' })
  @ApiResponse({
    status: 201,
    description: 'Сообщение успешно добавлено',
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные данные сообщения',
  })
  @ApiResponse({
    status: 404,
    description: 'Событие не найдено',
  })
  @ApiResponse({
    status: 403,
    description: 'Пользователь не является членом сообщества',
  })
  async addMessage(@Body() addMessageDto: AddMessageDto) {
    return this.eventsService.addMessage(addMessageDto);
  }

  @Post('messages/read')
  @ApiOperation({ summary: 'Отметить событие как прочитанное' })
  @ApiResponse({
    status: 200,
    description: 'Событие успешно отмечено как прочитанное',
  })
  @ApiResponse({
    status: 404,
    description: 'Событие не найдено',
  })
  @ApiResponse({
    status: 403,
    description: 'Пользователь не является членом сообщества',
  })
  async markEventAsReadByMessage(
    @Body() markEventReadDto: MarkEventReadDto,
  ): Promise<{ success: boolean }> {
    await this.eventsService.markEventAsReadByDto(markEventReadDto);
    return { success: true };
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Отметить событие как прочитанное' })
  @ApiResponse({
    status: 200,
    description: 'Событие успешно отмечено как прочитанное',
  })
  @ApiResponse({
    status: 404,
    description: 'Событие не найдено',
  })
  @ApiResponse({
    status: 403,
    description: 'Пользователь не является членом сообщества',
  })
  async markEventAsRead(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) eventId: number,
  ): Promise<{ success: boolean }> {
    await this.eventsService.markEventAsRead(userId, eventId);
    return { success: true };
  }

  @Get('messages/unread')
  @ApiOperation({ summary: 'Получить непрочитанные сообщения' })
  @ApiResponse({
    status: 200,
    description: 'Группированные непрочитанные сообщения по событиям',
    type: UnreadMessagesResponseDto,
    schema: {
      type: 'object',
      properties: {
        count: {
          type: 'object',
          description:
            'Объект с количеством непрочитанных сообщений по событиям',
          additionalProperties: {
            type: 'number',
            description: 'Количество непрочитанных сообщений для события',
          },
          example: { '1': 33, '2': 56, '6': 45 },
        },
        EVENT: {
          type: 'number',
          description:
            'Общее количество непрочитанных сообщений во всех событиях',
          example: 134,
        },
        NOTIFICATION: {
          type: 'number',
          description: 'Количество уведомлений',
          example: 5,
        },
      },
      example: {
        count: {
          '1': 33,
          '2': 56,
          '6': 45,
        },
        EVENT: 134,
        NOTIFICATION: 5,
      },
    },
  })
  async getUnreadMessages(
    @UserId() userId: number,
  ): Promise<UnreadMessagesResponseDto> {
    return this.eventsService.getUnreadMessages(userId);
  }
}
