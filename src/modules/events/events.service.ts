import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { GetEventsDto } from './dto/get-events.dto';
import { UnreadMessagesResponseDto } from './dto/unread-messages.dto';
import { EventsRepository } from './repositories/events.repository';
import { VotingRepository } from './repositories/voting.repository';
import { Event, EventMessage } from '@prisma/client';
import {
  EventAccessDeniedException,
  EventNotFoundException,
  UserNotInCommunityException,
} from '../../common/exceptions/event.exception';
import {
  UserNotParticipantException,
  UserNotCommunityMemberException,
  UserAlreadyVotedException,
  UserNotVotedException,
  EventHasNoVotingException,
  VotingOptionNotFoundException,
} from '../../common/exceptions/voting.exception';
import { BadRequestException } from '@nestjs/common';
import { EventMessagesRepository } from './repositories/event-messages.repository';
import { CreateMessageDto } from './dto/create-message.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { EventDto, EventsListDto } from './dto/event.dto';
import { VoteDto, VoteResponseDto } from './dto/vote.dto';
import { VotingResultsDto } from './dto/voting-results.dto';
import { plainToInstance } from 'class-transformer';
import {
  IEvent,
  IEventsList,
  ICreateEventData,
  IUpdateEventData,
  IEventFilters,
} from './interfaces/event.interface';
import { GetEventsAdminDto } from './dto/get-events-admin.dto';
import { EventsPaginatedAdminDto } from './dto/events-paginated-admin.dto';
import { transformBoolean } from '../../common/utils/boolean-transformer.util';
import { Logger } from '@nestjs/common';
import { NotificationEventService } from '../notifications/services/notification-event.service';
import { UserService } from '../users/services/user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UnifiedMessageNotificationService } from './services/unified-message-notification.service';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly eventMessagesRepository: EventMessagesRepository,
    private readonly votingRepository: VotingRepository,
    private readonly notificationEventService: NotificationEventService,
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly unifiedMessageNotificationService: UnifiedMessageNotificationService,
  ) {}

  private isTrueBoolean(value: any): boolean {
    return transformBoolean(value);
  }

  private normalizeVotingOptions(dto: { votingOptions?: any }) {
    if (!dto) return;
    const { votingOptions } = dto as any;
    if (!votingOptions) return;

    if (typeof votingOptions === 'string') {
      (dto as any).votingOptions = votingOptions
        .split(',')
        .map((v: string) => v.trim())
        .filter((v: string) => v.length > 0)
        .map((text: string) => ({ text }));
      return;
    }

    if (Array.isArray(votingOptions)) {
      if (votingOptions.every((v: any) => typeof v === 'string')) {
        (dto as any).votingOptions = (votingOptions as string[])
          .map((v) => v.trim())
          .filter((v) => v.length > 0)
          .map((text) => ({ text }));
      } else if (
        votingOptions.every((v: any) => typeof v === 'object' && v !== null)
      ) {

        const validOptions = votingOptions
          .filter((v: any) => v && typeof v === 'object')
          .map((v: any) => {
            if (
              v.text &&
              typeof v.text === 'string' &&
              v.text.trim().length > 0
            ) {
              return { text: v.text.trim() };
            }
            return null;
          })
          .filter((v: any) => v !== null);

        if (validOptions.length === 0 && votingOptions.length > 0) {
          const extractedOptions = votingOptions
            .filter((v: any) => v && typeof v === 'object')
            .map((v: any) => {
              const text = Object.values(v).find(
                (val) => typeof val === 'string' && val.trim().length > 0,
              );
              if (text) {
                return { text: (text as string).trim() };
              }
              return null;
            })
            .filter((v: any) => v !== null);

          if (extractedOptions.length > 0) {
            (dto as any).votingOptions = extractedOptions;
            return;
          }
        }

        (dto as any).votingOptions = validOptions;
      }
    }
  }

  private validateLifetimeHours(lifetimeHours: number | undefined, eventType: string): number | null {
    if (eventType !== 'NOTIFICATION') {
      return null;
    }

    if (lifetimeHours === undefined || lifetimeHours === null) {
      return 24;
    }

    if (lifetimeHours < 1) {
      throw new BadRequestException('Время жизни уведомления должно быть не менее 1 часа');
    }

    return lifetimeHours;
  }

  async createEvent(
    userId: number,
    dto: CreateEventDto,
    image?: Express.Multer.File,
  ): Promise<IEvent> {

    const isUserInCommunity = await this.eventsRepository.isUserInCommunity(
      userId,
      dto.communityId,
    );

    if (!isUserInCommunity) {
      throw new UserNotInCommunityException();
    }

    this.normalizeVotingOptions(dto);
    const needsVoting = this.isTrueBoolean(dto.hasVoting);
    const lifetimeHours = this.validateLifetimeHours(dto.lifetimeHours, dto.type);

    if (needsVoting) {
      if (!dto.votingQuestion) {
        throw new BadRequestException(
          'При включении голосования необходимо указать вопрос для голосования',
        );
      }
      if (!dto.votingOptions || dto.votingOptions.length < 2) {
        throw new BadRequestException(
          'При включении голосования необходимо указать минимум 2 варианта ответа',
        );
      }
      const validOptions = dto.votingOptions.filter(
        (option) =>
          option.text &&
          typeof option.text === 'string' &&
          option.text.trim().length > 0,
      );
      if (validOptions.length < 2) {
        throw new BadRequestException(
          `Необходимо указать минимум 2 корректных варианта ответа с непустым текстом. Получено: ${validOptions.length} из ${dto.votingOptions?.length || 0}`,
        );
      }
    }

    let event;
    const eventData = {
      ...dto,
      hasVoting: needsVoting,
      hasMoneyCollection: this.isTrueBoolean(dto.hasMoneyCollection),
      createdBy: userId,
      image: image?.filename || null,
      eventDateTime: dto.eventDateTime,
      lifetimeHours: lifetimeHours,
    };

    if (needsVoting && dto.votingOptions && dto.votingOptions.length > 0) {
      event = await this.eventsRepository.createWithVotingOptions(
        eventData,
        dto.votingOptions,
      );
    } else {
      event = await this.eventsRepository.create(eventData);
    }

    try {
      const creator = await this.userService.findById(userId);
      const community = await this.prisma.community.findUnique({
        where: { id: dto.communityId },
        select: { name: true },
      });

      if (community && creator) {
        const creatorName =
          `${creator.firstName || ''} ${creator.lastName || ''}`.trim();

        await this.notificationEventService.notifyEventCreated({
          eventId: event.id,
          eventTitle: event.title,
          communityId: dto.communityId,
          communityName: community.name,
          createdByName: creatorName,
        });

        this.logger.log(
          `Отправлено уведомление о создании события ${event.id}`,
        );
      }
    } catch (notificationError) {
      this.logger.error(
        `Ошибка отправки уведомления о создании события: ${notificationError.message}`,
      );
    }

    return this.transformEventToDto(event);
  }

  async getCommunityEvents(
    communityId: number,
    filters: GetEventsDto,
  ): Promise<IEventsList> {
    const result = await this.eventsRepository.findManyByCommunity(
      communityId,
      filters,
    );
    return {
      events: result.events.map((event) => this.transformEventToDto(event)),
      total: result.total,
    };
  }

  async getEventById(id: number): Promise<IEvent> {
    const event = await this.eventsRepository.findById(id);
    return this.transformEventToDto(event);
  }

  async updateEvent(
    userId: number,
    eventId: number,
    dto: UpdateEventDto,
    image?: Express.Multer.File,
  ): Promise<IEvent> {
    const hasAccess = await this.eventsRepository.checkEventAccess(
      userId,
      eventId,
    );

    if (!hasAccess) {
      throw new EventAccessDeniedException();
    }

    const existingEvent = await this.eventsRepository.findByIdIncludingCompleted(eventId);
    
    if (existingEvent.status === 'COMPLETED') {
      throw new BadRequestException('Нельзя редактировать завершенное событие');
    }

    this.normalizeVotingOptions(dto);
    const needsVoting = dto.hasVoting !== undefined ? this.isTrueBoolean(dto.hasVoting) : undefined;
    const lifetimeHours = this.validateLifetimeHours(dto.lifetimeHours, dto.type);

    if (needsVoting === true) {
      if (!dto.votingQuestion) {
        throw new BadRequestException(
          'При включении голосования необходимо указать вопрос для голосования',
        );
      }
      if (!dto.votingOptions || dto.votingOptions.length < 2) {
        throw new BadRequestException(
          'При включении голосования необходимо указать минимум 2 варианта ответа',
        );
      }
      // Проверяем, что все варианты имеют корректный текст
      const validOptions = dto.votingOptions.filter(
        (option) =>
          option.text &&
          typeof option.text === 'string' &&
          option.text.trim().length > 0,
      );
      if (validOptions.length < 2) {
        throw new BadRequestException(
          'Необходимо указать минимум 2 корректных варианта ответа с непустым текстом',
        );
      }
    }

    // Подготавливаем данные с правильными булевыми значениями
    const updateData = {
      ...dto,
      hasVoting: needsVoting,
      hasMoneyCollection:
        dto.hasMoneyCollection !== undefined
          ? this.isTrueBoolean(dto.hasMoneyCollection)
          : undefined,
      image: image?.filename || undefined, // Обновляем изображение только если передано
      lifetimeHours: lifetimeHours,
    };

    const event = await this.eventsRepository.update(eventId, updateData);
    return this.transformEventToDto(event);
  }

  async deleteEvent(userId: number, eventId: number): Promise<void> {
    const hasAccess = await this.eventsRepository.checkEventAccess(
      userId,
      eventId,
    );

    if (!hasAccess) {
      throw new EventAccessDeniedException();
    }

    try {
      const event = await this.eventsRepository.findById(eventId);

      if (event) {
        const community = await this.prisma.community.findUnique({
          where: { id: event.communityId },
          include: {
            users: { select: { userId: true } },
            creator: { select: { id: true } },
          },
        });

        const deleter = await this.userService.findById(userId);
        const deleterName = deleter
          ? `${deleter.firstName || ''} ${deleter.lastName || ''}`.trim()
          : 'Пользователь';

        if (community) {
          const allCommunityUserIds = [
            ...community.users.map((u) => u.userId),
            community.creator.id,
          ];
          const uniqueUserIds = Array.from(new Set(allCommunityUserIds));

          await this.notificationEventService.notifyEventDeleted({
            eventId: event.id,
            eventTitle: event.title,
            participantIds: uniqueUserIds,
            deletedByName: deleterName,
            deletedById: userId,
          });

          this.logger.log(
            `Отправлено уведомление об удалении события ${eventId} пользователем ${userId}`,
          );
        }
      }
    } catch (notificationError) {
      this.logger.error(
        `Ошибка отправки уведомления об удалении события: ${notificationError.message}`,
      );
    }

    await this.eventsRepository.delete(eventId);
  }

  async joinEvent(userId: number, eventId: number): Promise<IEvent> {
    try {
      this.logger.log(`Attempting to join event ${eventId} for user ${userId}`);

      const event = await this.eventsRepository.findById(eventId);
      this.logger.log(`Event found: ${event.id} - ${event.title}`);

      const isUserInCommunity = await this.eventsRepository.isUserInCommunity(
        userId,
        event.communityId,
      );
      this.logger.log(
        `User ${userId} in community ${event.communityId}: ${isUserInCommunity}`,
      );

      if (!isUserInCommunity) {
        this.logger.warn(
          `User ${userId} is not a member of community ${event.communityId}`,
        );
        throw new UserNotInCommunityException();
      }

      const isParticipant = await this.eventsRepository.isUserParticipant(
        userId,
        eventId,
      );
      this.logger.log(`User ${userId} already participant: ${isParticipant}`);

      if (isParticipant) {
        this.logger.log(
          `User ${userId} is already a participant of event ${eventId}`,
        );
        return this.transformEventToDto(event);
      }

      await this.eventsRepository.addParticipant(userId, eventId);
      this.logger.log(`Successfully added user ${userId} to event ${eventId}`);

      const updatedEvent = await this.eventsRepository.findById(eventId);

      try {
        const user = await this.userService.findById(userId);
        const userName =
          `${user.firstName || ''} ${user.lastName || ''}`.trim();

        await this.notificationEventService.notifyUserJoinedEvent({
          eventId: event.id,
          eventTitle: event.title,
          userName,
          userId,
        });

        this.logger.log(
          `Notification sent for user ${userId} joining event ${eventId}`,
        );
      } catch (notificationError) {
        this.logger.error(
          `Failed to send notification for event join: ${notificationError.message}`,
        );
      }

      return this.transformEventToDto(updatedEvent);
    } catch (error) {
      this.logger.error(
        `Error in joinEvent for user ${userId}, event ${eventId}: ${error.message}`,
      );
      this.logger.error(`Error stack: ${error.stack}`);

      if (
        error instanceof UserNotInCommunityException ||
        error instanceof EventNotFoundException
      ) {
        throw error;
      }

      throw new Error(`Ошибка при присоединении к событию: ${error.message}`);
    }
  }

  async leaveEvent(userId: number, eventId: number): Promise<IEvent> {
    const event = await this.eventsRepository.findById(eventId);
    const isParticipant = await this.eventsRepository.isUserParticipant(
      userId,
      eventId,
    );

    if (!isParticipant) {
      return this.transformEventToDto(event);
    }

    await this.eventsRepository.removeParticipant(userId, eventId);

    const updatedEvent = await this.eventsRepository.findById(eventId);

    try {
      const user = await this.userService.findById(userId);
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

      await this.notificationEventService.notifyUserLeftEvent({
        eventId: event.id,
        eventTitle: event.title,
        userName,
        userId,
      });

      this.logger.log(
        `Notification sent for user ${userId} leaving event ${eventId}`,
      );
    } catch (notificationError) {
      this.logger.error(
        `Failed to send notification for event leave: ${notificationError.message}`,
      );
    }

    return this.transformEventToDto(updatedEvent);
  }

  async createMessage(
    userId: number,
    eventId: number,
    dto: CreateMessageDto,
  ): Promise<EventMessage> {
    const event = await this.eventsRepository.findById(eventId);

    if (!event) {
      throw new EventNotFoundException();
    }

    const isUserInCommunity = await this.eventsRepository.isUserInCommunity(
      userId,
      event.communityId,
    );
    if (!isUserInCommunity) {
      throw new UserNotInCommunityException();
    }

    const message = await this.eventMessagesRepository.createMessage(
      userId,
      eventId,
      dto,
    );

    try {
      const eventWithParticipants = await this.prisma.event.findUnique({
        where: { id: eventId },
        include: {
          participants: { select: { userId: true } },
          creator: { select: { id: true } },
        },
      });

      const author = await this.userService.findById(userId);
      const authorName = author
        ? `${author.firstName || ''} ${author.lastName || ''}`.trim()
        : 'Пользователь';

      if (eventWithParticipants) {
        const allParticipantIds = [
          ...eventWithParticipants.participants.map((p) => p.userId),
          eventWithParticipants.creator.id,
        ];
        const uniqueParticipantIds = Array.from(new Set(allParticipantIds));

        await this.unifiedMessageNotificationService.processMessageNotification(
          message,
          {
            messageId: message.id,
            eventId: event.id,
            eventTitle: event.title,
            eventType: event.type,
            messageText: dto.text,
            authorId: userId,
            authorName,
            participantIds: uniqueParticipantIds,
            source: 'websocket',
          },
        );

        this.logger.log(
          `Уведомление о новом сообщении обработано через унифицированный сервис для события ${eventId} от пользователя ${userId}`,
        );
      }
    } catch (notificationError) {
      this.logger.error(
        `Ошибка отправки уведомления о новом сообщении: ${notificationError.message}`,
      );
    }

    return message;
  }

  async addMessage(dto: AddMessageDto): Promise<EventMessage> {
    const event = await this.eventsRepository.findById(dto.eventId);

    if (!event) {
      throw new EventNotFoundException();
    }

    const isUserInCommunity = await this.eventsRepository.isUserInCommunity(
      dto.userId,
      event.communityId,
    );
    if (!isUserInCommunity) {
      throw new UserNotInCommunityException();
    }

    const message = await this.eventMessagesRepository.addMessage(dto);

    try {
      const eventWithParticipants = await this.prisma.event.findUnique({
        where: { id: dto.eventId },
        include: {
          participants: { select: { userId: true } },
          creator: { select: { id: true } },
        },
      });

      const author = await this.userService.findById(dto.userId);
      const authorName = author
        ? `${author.firstName || ''} ${author.lastName || ''}`.trim()
        : 'Пользователь';

      if (eventWithParticipants) {
        const allParticipantIds = [
          ...eventWithParticipants.participants.map((p) => p.userId),
          eventWithParticipants.creator.id,
        ];
        const uniqueParticipantIds = Array.from(new Set(allParticipantIds));

        await this.unifiedMessageNotificationService.processMessageNotification(
          message,
          {
            messageId: message.id,
            eventId: event.id,
            eventTitle: event.title,
            eventType: event.type,
            messageText: dto.text,
            authorId: dto.userId,
            authorName,
            participantIds: uniqueParticipantIds,
            source: 'http',
          },
        );

        this.logger.log(
          `Уведомление о новом сообщении обработано через унифицированный сервис для события ${dto.eventId} от пользователя ${dto.userId}`,
        );
      }
    } catch (notificationError) {
      this.logger.error(
        `Ошибка отправки уведомления о новом сообщении: ${notificationError.message}`,
      );
    }

    return message;
  }

  async getEventMessages(
    eventId: number,
    userId: number,
    page: number = 1,
    limit: number = 50,
  ): Promise<EventMessage[]> {
    const event = await this.eventsRepository.findById(eventId);
    if (!event) {
      throw new EventNotFoundException();
    }

    const isUserInCommunity = await this.eventsRepository.isUserInCommunity(
      userId,
      event.communityId,
    );

    if (!isUserInCommunity) {
      throw new UserNotInCommunityException();
    }

    return this.eventMessagesRepository.getEventMessages(eventId, page, limit);
  }

  /**
   * Получает все события с фильтрами и пагинацией (админ)
   */
  async findAllEventsForAdmin(
    filters: GetEventsAdminDto,
  ): Promise<EventsPaginatedAdminDto> {
    const { page = 1, limit = 10 } = filters;
    const { data, total } =
      await this.eventsRepository.findAllWithPaginationForAdmin(filters);
    const totalPages = Math.ceil(total / limit);
    return {
      data: data.map((event) => this.transformEventToDto(event)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Получает событие по ID (админ)
   */
  async getEventByIdForAdmin(id: number): Promise<IEvent> {
    const event = await this.eventsRepository.findById(id);
    return this.transformEventToDto(event);
  }

  /**
   * Создает событие от имени администратора (без проверки участника сообщества)
   */
  async createEventByAdmin(
    adminId: number,
    dto: CreateEventDto,
    image?: Express.Multer.File,
  ): Promise<IEvent> {
    this.normalizeVotingOptions(dto);
    const needsVoting = this.isTrueBoolean(dto.hasVoting);
    const lifetimeHours = this.validateLifetimeHours(dto.lifetimeHours, dto.type);

    if (needsVoting) {
      if (!dto.votingQuestion) {
        throw new BadRequestException(
          'При включении голосования необходимо указать вопрос для голосования',
        );
      }
      if (!dto.votingOptions || dto.votingOptions.length < 2) {
        throw new BadRequestException(
          'При включении голосования необходимо указать минимум 2 варианта ответа',
        );
      }
    }

    const eventData = {
      ...dto,
      hasVoting: needsVoting,
      hasMoneyCollection: this.isTrueBoolean(dto.hasMoneyCollection),
      createdBy: adminId,
      image: image?.filename || null,
      eventDateTime: dto.eventDateTime,
      lifetimeHours: lifetimeHours,
    };

    let event;
    if (needsVoting && dto.votingOptions && dto.votingOptions.length > 0) {
      event = await this.eventsRepository.createWithVotingOptions(
        eventData,
        dto.votingOptions,
      );
    } else {
      event = await this.eventsRepository.create(eventData);
    }

    try {
      const admin = await this.userService.findById(adminId);
      const community = await this.prisma.community.findUnique({
        where: { id: dto.communityId },
        select: { name: true },
      });

      if (community && admin) {
        const adminName =
          `${admin.firstName || ''} ${admin.lastName || ''}`.trim();

        await this.notificationEventService.notifyEventCreated({
          eventId: event.id,
          eventTitle: event.title,
          communityId: dto.communityId,
          communityName: community.name,
          createdByName: adminName,
        });

        this.logger.log(
          `Отправлено уведомление о создании события ${event.id} администратором`,
        );
      }
    } catch (notificationError) {
      this.logger.error(
        `Ошибка отправки уведомления о создании события администратором: ${notificationError.message}`,
      );
    }

    return this.transformEventToDto(event);
  }

  /**
   * Обновляет событие (админ)
   */
  async updateEventByAdmin(
    eventId: number,
    dto: UpdateEventDto,
    image?: Express.Multer.File,
  ): Promise<IEvent> {
    const existingEvent = await this.eventsRepository.findByIdIncludingCompleted(eventId);
    
    if (existingEvent.status === 'COMPLETED') {
      throw new BadRequestException('Нельзя редактировать завершенное событие');
    }
    this.normalizeVotingOptions(dto);
    const needsVoting = dto.hasVoting !== undefined ? this.isTrueBoolean(dto.hasVoting) : undefined;
    const lifetimeHours = this.validateLifetimeHours(dto.lifetimeHours, dto.type);

    if (needsVoting === true) {
      if (!dto.votingQuestion) {
        throw new BadRequestException(
          'При включении голосования необходимо указать вопрос для голосования',
        );
      }
      if (!dto.votingOptions || dto.votingOptions.length < 2) {
        throw new BadRequestException(
          'При включении голосования необходимо указать минимум 2 варианта ответа',
        );
      }
      // Проверяем, что все варианты имеют корректный текст
      const validOptions = dto.votingOptions.filter(
        (option) =>
          option.text &&
          typeof option.text === 'string' &&
          option.text.trim().length > 0,
      );
      if (validOptions.length < 2) {
        throw new BadRequestException(
          'Необходимо указать минимум 2 корректных варианта ответа с непустым текстом',
        );
      }
    }

    // Подготавливаем данные с правильными булевыми значениями
    const updateData = {
      ...dto,
      hasVoting: needsVoting,
      hasMoneyCollection:
        dto.hasMoneyCollection !== undefined
          ? this.isTrueBoolean(dto.hasMoneyCollection)
          : undefined,
      image: image?.filename || undefined, // Обновляем изображение только если передано
      lifetimeHours: lifetimeHours,
    };

    const event = await this.eventsRepository.update(eventId, updateData);
    return this.transformEventToDto(event);
  }

  /**
   * Удаляет событие (админ)
   */
  async deleteEventByAdmin(eventId: number): Promise<void> {
    try {
      const event = await this.eventsRepository.findById(eventId);

      if (event) {
        const community = await this.prisma.community.findUnique({
          where: { id: event.communityId },
          include: {
            users: { select: { userId: true } },
            creator: { select: { id: true } },
          },
        });

        if (community) {
          const allCommunityUserIds = [
            ...community.users.map((u) => u.userId),
            community.creator.id,
          ];
          const uniqueUserIds = Array.from(new Set(allCommunityUserIds));

          await this.notificationEventService.notifyEventDeleted({
            eventId: event.id,
            eventTitle: event.title,
            participantIds: uniqueUserIds,
            deletedByName: 'Администратор',
          });

          this.logger.log(
            `Отправлено уведомление об удалении события ${eventId} администратором`,
          );
        }
      }
    } catch (notificationError) {
      this.logger.error(
        `Ошибка отправки уведомления об удалении события администратором: ${notificationError.message}`,
      );
    }

    await this.eventsRepository.delete(eventId);
  }

  /**
   * Завершает событие
   */
  async completeEvent(userId: number, eventId: number): Promise<IEvent> {
    const hasAccess = await this.eventsRepository.checkEventAccess(
      userId,
      eventId,
    );

    if (!hasAccess) {
      throw new EventAccessDeniedException();
    }

    const existingEvent = await this.eventsRepository.findByIdIncludingCompleted(eventId);
    
    if (existingEvent.status === 'COMPLETED') {
      throw new BadRequestException('Событие уже завершено');
    }

    const completedEvent = await this.eventsRepository.completeEvent(eventId);

    try {
      const completer = await this.userService.findById(userId);
      const completerName = completer
        ? `${completer.firstName || ''} ${completer.lastName || ''}`.trim()
        : 'Пользователь';

      const community = await this.prisma.community.findUnique({
        where: { id: existingEvent.communityId },
        include: {
          users: { select: { userId: true } },
          creator: { select: { id: true } },
        },
      });

      if (community) {
        const allParticipantIds = [
          ...existingEvent.participants.map((p: any) => p.userId),
          existingEvent.createdBy,
        ];
        const uniqueParticipantIds = Array.from(new Set(allParticipantIds));

        await this.notificationEventService.notifyEventCompleted({
          eventId: existingEvent.id,
          eventTitle: existingEvent.title,
          participantIds: uniqueParticipantIds,
          completedByName: completerName,
          completedById: userId,
        });

        this.logger.log(
          `Отправлено уведомление о завершении события ${eventId} пользователем ${userId}`,
        );
      }
    } catch (notificationError) {
      this.logger.error(
        `Ошибка отправки уведомления о завершении события: ${notificationError.message}`,
      );
    }

    return this.transformEventToDto(completedEvent);
  }

  /**
   * Возвращает событие к активному статусу
   */
  async resumeEvent(userId: number, eventId: number): Promise<IEvent> {
    const hasAccess = await this.eventsRepository.checkEventAccess(
      userId,
      eventId,
    );

    if (!hasAccess) {
      throw new EventAccessDeniedException();
    }

    const existingEvent = await this.eventsRepository.findByIdIncludingCompleted(eventId);
    
    if (existingEvent.status === 'ACTIVE') {
      throw new BadRequestException('Событие уже активно');
    }

    const resumedEvent = await this.eventsRepository.resumeEvent(eventId);

    try {
      const resumer = await this.userService.findById(userId);
      const resumerName = resumer
        ? `${resumer.firstName || ''} ${resumer.lastName || ''}`.trim()
        : 'Пользователь';

      const community = await this.prisma.community.findUnique({
        where: { id: existingEvent.communityId },
        include: {
          users: { select: { userId: true } },
          creator: { select: { id: true } },
        },
      });

      if (community) {
        const allParticipantIds = [
          ...existingEvent.participants.map((p: any) => p.userId),
          existingEvent.createdBy,
        ];
        const uniqueParticipantIds = Array.from(new Set(allParticipantIds));

        await this.notificationEventService.notifyEventResumed({
          eventId: existingEvent.id,
          eventTitle: existingEvent.title,
          participantIds: uniqueParticipantIds,
          resumedByName: resumerName,
          resumedById: userId,
        });

        this.logger.log(
          `Отправлено уведомление о возобновлении события ${eventId} пользователем ${userId}`,
        );
      }
    } catch (notificationError) {
      this.logger.error(
        `Ошибка отправки уведомления о возобновлении события: ${notificationError.message}`,
      );
    }

    return this.transformEventToDto(resumedEvent);
  }

  /**
   * Преобразует данные события в DTO
   */
  private transformEventToDto(event: any): IEvent {
    return plainToInstance(
      EventDto,
      {
        ...event,
        participants:
          event.participants?.map((p: any) => ({
            id: p.user.id,
            firstName: p.user.firstName,
            lastName: p.user.lastName,
            avatar: p.user.avatar,
            latitude: p.user.latitude,
            longitude: p.user.longitude,
            address: p.user.address,
          })) || [],
        votingOptions: event.votingOptions || [],
        category: event.category
          ? {
              id: event.category.id,
              name: event.category.name,
              icon: event.category.icon,
              color: event.category.color,
              type: event.category.type,
              isActive: event.category.isActive,
            }
          : undefined,
        community: event.community
          ? {
              id: event.community.id,
              name: event.community.name,
              description: event.community.description,
            }
          : undefined,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  /**
   * Проголосовать в мероприятии
   */
  async voteInEvent(
    userId: number,
    eventId: number,
    voteDto: VoteDto,
  ): Promise<VoteResponseDto> {
    // Проверяем, что мероприятие существует и содержит голосование
    const hasVoting = await this.votingRepository.isEventWithVoting(eventId);
    if (!hasVoting) {
      throw new EventHasNoVotingException();
    }
    const event = await this.eventsRepository.findById(eventId);
    // Проверяем, что пользователь является участником мероприятия
    const isCommunityMember = await this.eventsRepository.isUserInCommunity(
      userId,
      event.communityId,
    );
    if (!isCommunityMember) {
      throw new UserNotCommunityMemberException();
    }

    // Проверяем, что вариант ответа существует для данного мероприятия
    const optionExists = await this.votingRepository.isVotingOptionExists(
      eventId,
      voteDto.votingOptionId,
    );
    if (!optionExists) {
      throw new VotingOptionNotFoundException();
    }

    // Проверяем, что пользователь еще не голосовал
    const hasVoted = await this.votingRepository.hasUserVoted(eventId, userId);
    if (hasVoted) {
      throw new UserAlreadyVotedException();
    }

    // Создаем голос
    const vote = await this.votingRepository.createVote(
      eventId,
      voteDto.votingOptionId,
      userId,
    );

    return {
      id: vote.id,
      eventId: vote.eventId,
      votingOptionId: vote.votingOptionId,
      userId: vote.userId,
      createdAt: vote.createdAt,
    };
  }

  /**
   * Отменить голос в мероприятии
   */
  async cancelVoteInEvent(userId: number, eventId: number): Promise<void> {
    // Проверяем, что мероприятие существует и содержит голосование
    const hasVoting = await this.votingRepository.isEventWithVoting(eventId);
    if (!hasVoting) {
      throw new EventHasNoVotingException();
    }

    const event = await this.eventsRepository.findById(eventId);
    // Проверяем, что пользователь является участником мероприятия
    const isCommunityMember = await this.eventsRepository.isUserInCommunity(
      userId,
      event.communityId,
    );
    if (!isCommunityMember) {
      throw new UserNotCommunityMemberException();
    }

    // Проверяем, что пользователь голосовал
    const hasVoted = await this.votingRepository.hasUserVoted(eventId, userId);
    if (!hasVoted) {
      throw new UserNotVotedException();
    }

    // Удаляем голос
    await this.votingRepository.removeVote(eventId, userId);
  }

  /**
   * Получить результаты голосования в мероприятии
   */
  async getVotingResults(
    eventId: number,
    userId: number,
  ): Promise<VotingResultsDto> {
    // Проверяем, что мероприятие существует и содержит голосование
    const hasVoting = await this.votingRepository.isEventWithVoting(eventId);
    if (!hasVoting) {
      throw new EventHasNoVotingException();
    }

    // Получаем мероприятие для определения сообщества
    const event = await this.eventsRepository.findById(eventId);

    // Проверяем, что пользователь является членом сообщества
    const isCommunityMember = await this.eventsRepository.isUserInCommunity(
      userId,
      event.communityId,
    );
    if (!isCommunityMember) {
      throw new UserNotCommunityMemberException();
    }

    // Получаем результаты голосования
    const results = await this.votingRepository.getVotingResults(
      eventId,
      userId,
    );

    return {
      eventId,
      votingQuestion: results.votingQuestion,
      totalVotes: results.totalVotes,
      options: results.options,
      hasVoted: results.hasVoted,
      userVoteOptionId: results.userVoteOptionId,
    };
  }

  /**
   * Получить варианты ответов для голосования в мероприятии
   */
  async getVotingOptions(eventId: number, userId: number): Promise<any[]> {
    // Проверяем, что мероприятие существует и содержит голосование
    const hasVoting = await this.votingRepository.isEventWithVoting(eventId);
    if (!hasVoting) {
      throw new EventHasNoVotingException();
    }

    // Проверяем, что пользователь является участником мероприятия
    const isParticipant = await this.eventsRepository.isUserParticipant(
      userId,
      eventId,
    );
    if (!isParticipant) {
      throw new UserNotParticipantException();
    }

    // Получаем варианты ответов
    const options = await this.votingRepository.getVotingOptions(eventId);

    return options.map((option) => ({
      id: option.id,
      text: option.text,
    }));
  }

  /**
   * Отмечает событие как прочитанное для пользователя
   */
  async markEventAsRead(userId: number, eventId: number): Promise<void> {
    // Проверяем, что событие существует
    const event = await this.eventsRepository.findById(eventId);
    if (!event) {
      throw new EventNotFoundException();
    }

    // Проверяем, что пользователь является членом сообщества
    const isUserInCommunity = await this.eventsRepository.isUserInCommunity(
      userId,
      event.communityId,
    );
    if (!isUserInCommunity) {
      throw new UserNotInCommunityException();
    }

    // Отмечаем событие как прочитанное
    await this.eventMessagesRepository.markEventAsRead(userId, eventId);
  }

  /**
   * Получает непрочитанные сообщения для пользователя, группированные по событиям
   */
  async getUnreadMessages(userId: number): Promise<UnreadMessagesResponseDto> {
    return this.eventMessagesRepository.getUnreadMessagesGroupedByEvent(userId);
  }

  /**
   * Отмечает событие как прочитанное для конкретного пользователя (для авточтения)
   */
  async markEventAsReadForUser(userId: number, eventId: number): Promise<{ seenAt: Date; user: any; message: any }> {
    const event = await this.eventsRepository.findById(eventId);
    if (!event) {
      throw new EventNotFoundException();
    }
    const isUserInCommunity = await this.eventsRepository.isUserInCommunity(
      userId,
      event.communityId,
    );
    if (!isUserInCommunity) {
      throw new UserNotInCommunityException();
    }
    const result = await this.eventMessagesRepository.markEventAsRead(userId, eventId);
    const readerData = await this.eventMessagesRepository.getUserAndLastMessage(userId, eventId);
    
    this.logger.log(
      `Пользователь ${userId} авточтение события ${eventId} на ${new Date().toISOString()}`,
    );
    
    return {
      seenAt: result.readAt,
      user: readerData.user,
      message: readerData.lastMessage,
    };
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredNotifications(): Promise<void> {
    this.logger.log('Запуск очистки истекших уведомлений...');

    try {
      const now = new Date();
      let totalDeactivated = 0;

      const distinctLifetimes = await this.prisma.event.findMany({
        where: {
          type: 'NOTIFICATION',
          lifetimeHours: { not: null },
          isActive: true,
        },
        select: { lifetimeHours: true },
        distinct: ['lifetimeHours'],
      });

      for (const { lifetimeHours } of distinctLifetimes) {
        if (!lifetimeHours) continue;

        const expirationTime = new Date(now.getTime() - lifetimeHours * 60 * 60 * 1000);
        
        const result = await this.prisma.event.updateMany({
          where: {
            type: 'NOTIFICATION',
            lifetimeHours: lifetimeHours,
            isActive: true,
            createdAt: { lt: expirationTime },
          },
          data: { isActive: false },
        });

        if (result.count > 0) {
          totalDeactivated += result.count;
          this.logger.log(
            `Деактивировано ${result.count} истекших уведомлений с временем жизни ${lifetimeHours} часов`
          );
        }
      }

      this.logger.log(`Очистка завершена. Всего деактивировано уведомлений: ${totalDeactivated}`);
    } catch (error) {
      this.logger.error(
        `Ошибка при очистке истекших уведомлений: ${error.message}`,
        error.stack
      );
    }
  }
}
