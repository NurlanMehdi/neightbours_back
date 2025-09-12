import { Injectable, UnauthorizedException } from '@nestjs/common';
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
import { MarkEventReadDto } from './dto/mark-event-read.dto';
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

/**
 * 🎯 EVENTS SERVICE - NOTIFICATION DUPLICATE FIX IMPLEMENTED
 * 
 * CRITICAL CHANGES MADE TO PREVENT DUPLICATE NOTIFICATIONS:
 * 
 * ❌ ORIGINAL PROBLEM (Root Cause):
 * - Frontend was calling multiple message endpoints for same message
 * - Each endpoint had separate notification logic
 * - Result: Multiple push notifications for single message
 * 
 * ✅ SOLUTION IMPLEMENTED:
 * 1. Unified all message creation through single createMessage() method
 * 2. Refactored addMessage() to call createMessage() internally
 * 3. Added frontend duplicate detection (10-second window)
 * 4. Added repository-level duplicate prevention (5-second window)
 * 5. Added source tracking to identify frontend call patterns
 * 
 * 🛡️ PROTECTION LAYERS:
 * - Layer 1: Frontend duplicate detection (blocks rapid duplicate calls)
 * - Layer 2: Repository duplicate check (prevents duplicate DB records)
 * - Layer 3: Unified notification pathway (one notification per message)
 * 
 * 📊 MONITORING:
 * - Logs warn when frontend calls multiple endpoints for same message
 * - Tracks message sources (WEBSOCKET, HTTP-POST, HTTP-ADDMESSAGE-LEGACY)
 * - Provides clear error messages when duplicates are blocked
 */
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  
  // Track recent message attempts to detect frontend double-calls
  private readonly recentMessageAttempts = new Map<string, {
    timestamp: number;
    source: string;
    messageId?: number;
  }>();

  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly eventMessagesRepository: EventMessagesRepository,
    private readonly votingRepository: VotingRepository,
    private readonly notificationEventService: NotificationEventService,
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Проверяет, является ли значение истинным булевым значением
   */
  private isTrueBoolean(value: any): boolean {
    return transformBoolean(value);
  }

  /**
   * Приводит dto.votingOptions к массиву объектов { text: string }
   */
  private normalizeVotingOptions(dto: { votingOptions?: any }) {
    if (!dto) return;
    const { votingOptions } = dto as any;
    if (!votingOptions) return;

    console.log(
      'normalizeVotingOptions input:',
      JSON.stringify(votingOptions, null, 2),
    );

    if (typeof votingOptions === 'string') {
      (dto as any).votingOptions = votingOptions
        .split(',')
        .map((v: string) => v.trim())
        .filter((v: string) => v.length > 0)
        .map((text: string) => ({ text }));
      console.log(
        'normalizeVotingOptions string result:',
        JSON.stringify((dto as any).votingOptions, null, 2),
      );
      return;
    }

    if (Array.isArray(votingOptions)) {
      if (votingOptions.every((v: any) => typeof v === 'string')) {
        (dto as any).votingOptions = (votingOptions as string[])
          .map((v) => v.trim())
          .filter((v) => v.length > 0)
          .map((text) => ({ text }));
        console.log(
          'normalizeVotingOptions array of strings result:',
          JSON.stringify((dto as any).votingOptions, null, 2),
        );
      } else if (
        votingOptions.every((v: any) => typeof v === 'object' && v !== null)
      ) {
        // Если это массив объектов, но они пустые или без text
        console.log(
          'Processing array of objects, first object keys:',
          Object.keys(votingOptions[0] || {}),
        );
        console.log(
          'First object content:',
          JSON.stringify(votingOptions[0], null, 2),
        );

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

        // Если все объекты пустые, попробуем извлечь данные из других полей
        if (validOptions.length === 0 && votingOptions.length > 0) {
          console.log(
            'All objects are empty, trying to extract from other fields...',
          );
          // Возможно, данные пришли в другом формате
          const extractedOptions = votingOptions
            .filter((v: any) => v && typeof v === 'object')
            .map((v: any) => {
              // Попробуем найти текст в любом поле объекта
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
            console.log(
              'normalizeVotingOptions extracted from other fields:',
              JSON.stringify((dto as any).votingOptions, null, 2),
            );
            return;
          }
        }

        (dto as any).votingOptions = validOptions;
        console.log(
          'normalizeVotingOptions array of objects result:',
          JSON.stringify((dto as any).votingOptions, null, 2),
        );
      }
    }
  }

  /**
   * Создает новое событие
   */
  async createEvent(
    userId: number,
    dto: CreateEventDto,
    image?: Express.Multer.File,
  ): Promise<IEvent> {
    console.log(
      'createEvent dto.votingOptions before normalize:',
      JSON.stringify(dto.votingOptions, null, 2),
    );

    const isUserInCommunity = await this.eventsRepository.isUserInCommunity(
      userId,
      dto.communityId,
    );

    if (!isUserInCommunity) {
      throw new UserNotInCommunityException();
    }

    // Нормализуем votingOptions (строка -> массив объектов)
    this.normalizeVotingOptions(dto);

    // Проверяем, действительно ли нужно голосование
    const needsVoting = this.isTrueBoolean(dto.hasVoting);

    // Валидация votingOptions только если нужно голосование
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
      // Проверяем, что все варианты имеют корректный текст
      const validOptions = dto.votingOptions.filter(
        (option) =>
          option.text &&
          typeof option.text === 'string' &&
          option.text.trim().length > 0,
      );
      if (validOptions.length < 2) {
        console.log(
          'Debug votingOptions:',
          JSON.stringify(dto.votingOptions, null, 2),
        );
        throw new BadRequestException(
          `Необходимо указать минимум 2 корректных варианта ответа с непустым текстом. Получено: ${validOptions.length} из ${dto.votingOptions?.length || 0}`,
        );
      }
    }

    let event;
    // Подготавливаем данные с правильными булевыми значениями
    const eventData = {
      ...dto,
      hasVoting: needsVoting,
      hasMoneyCollection: this.isTrueBoolean(dto.hasMoneyCollection),
      createdBy: userId,
      image: image?.filename || null,
      eventDateTime: dto.eventDateTime,
    };

    // Если есть голосование, используем createWithVotingOptions
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

  /**
   * Получает все события сообщества с фильтрацией и пагинацией
   */
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

  /**
   * Получает событие по ID
   */
  async getEventById(id: number): Promise<IEvent> {
    const event = await this.eventsRepository.findById(id);
    return this.transformEventToDto(event);
  }

  /**
   * Обновляет событие
   */
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

    // Нормализуем votingOptions (строка -> массив объектов)
    this.normalizeVotingOptions(dto);

    // Проверяем, действительно ли нужно голосование
    const needsVoting =
      dto.hasVoting !== undefined
        ? this.isTrueBoolean(dto.hasVoting)
        : undefined;

    // Валидация votingOptions только если включается голосование
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
    };

    const event = await this.eventsRepository.update(eventId, updateData);
    return this.transformEventToDto(event);
  }

  /**
   * Удаляет событие
   */
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

  /**
   * Добавляет пользователя в участники события
   */
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

  /**
   * Удаляет пользователя из участников события
   */
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

  /**
   * 🔍 FRONTEND DUPLICATE DETECTION SYSTEM
   * 
   * This method detects when the frontend is calling multiple message endpoints
   * for the same message, which was the ROOT CAUSE of duplicate notifications.
   * 
   * ORIGINAL PROBLEM:
   * - Frontend was calling both WebSocket AND HTTP endpoints for same message
   * - This caused the same notification logic to run multiple times
   * - Users received multiple push notifications for single message
   * 
   * DETECTION LOGIC:
   * - Tracks recent message attempts by (userId + eventId + text)
   * - If same message attempted within 10 seconds, logs warning
   * - Helps identify frontend retry/fallback patterns
   * 
   * Detects and logs potential duplicate message attempts from frontend
   */
  private checkForDuplicateMessageAttempt(
    userId: number, 
    eventId: number, 
    text: string, 
    source: string
  ): { isDuplicate: boolean; originalSource?: string } {
    const messageKey = `${userId}-${eventId}-${text.substring(0, 50)}`;
    const now = Date.now();
    const recent = this.recentMessageAttempts.get(messageKey);
    
    if (recent && (now - recent.timestamp) < 10000) { // 10 second window
      this.logger.warn(`🚨 POTENTIAL DUPLICATE MESSAGE DETECTED!`);
      this.logger.warn(`   User ${userId} trying to send same message to event ${eventId}`);
      this.logger.warn(`   Original source: ${recent.source}`);
      this.logger.warn(`   Current source: ${source}`);
      this.logger.warn(`   Time difference: ${now - recent.timestamp}ms`);
      this.logger.warn(`   Text: "${text}"`);
      this.logger.warn(`   This indicates frontend is calling multiple endpoints for same message!`);
      
      return { isDuplicate: true, originalSource: recent.source };
    }
    
    // Track this attempt
    this.recentMessageAttempts.set(messageKey, {
      timestamp: now,
      source,
    });
    
    // Cleanup old entries
    if (this.recentMessageAttempts.size > 1000) {
      const oldEntries = Array.from(this.recentMessageAttempts.entries())
        .filter(([_, data]) => now - data.timestamp > 300000);
      oldEntries.forEach(([key]) => this.recentMessageAttempts.delete(key));
    }
    
    return { isDuplicate: false };
  }

  /**
   * 🎯 UNIFIED MESSAGE CREATION - THE DUPLICATE NOTIFICATION FIX
   * 
   * This is the SINGLE ENTRY POINT for all message creation to prevent
   * duplicate notifications that were caused by multiple endpoints.
   * 
   * ROOT CAUSE ANALYSIS:
   * 1. Frontend was calling multiple endpoints for same message:
   *    - WebSocket: handleMessage() → createMessage()
   *    - HTTP: POST /events/:id/messages → createMessage()  
   *    - HTTP: POST /events/messages → addMessage() [had separate notification logic]
   * 
   * 2. Each pathway triggered notifications independently
   * 3. Result: Multiple push notifications for single message
   * 
   * SOLUTION IMPLEMENTED:
   * 1. ✅ All pathways now use this single createMessage() method
   * 2. ✅ addMessage() refactored to call createMessage() internally
   * 3. ✅ Repository-level duplicate prevention (5-second window)
   * 4. ✅ Frontend duplicate detection and blocking (10-second window)
   * 5. ✅ Source tracking to identify which endpoint is being used
   * 
   * PROTECTION LAYERS:
   * - Layer 1: Frontend duplicate detection (this method)
   * - Layer 2: Repository duplicate check (EventMessagesRepository)
   * - Layer 3: Unified notification logic (no multiple pathways)
   * 
   * @param source - Identifies the calling pathway (WEBSOCKET, HTTP-POST, etc.)
   */
  async createMessage(
    userId: number,
    eventId: number,
    dto: CreateMessageDto,
    source: string = 'unknown'
  ): Promise<EventMessage> {
    const requestId = `createMessage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.logger.log(`[${requestId}] НАЧАЛО createMessage: userId=${userId}, eventId=${eventId}, text="${dto.text}", source=${source}`);
    
    // Check for potential duplicates
    const duplicateCheck = this.checkForDuplicateMessageAttempt(userId, eventId, dto.text, source);
    if (duplicateCheck.isDuplicate) {
      this.logger.error(`[${requestId}] ❌ DUPLICATE MESSAGE BLOCKED - frontend calling multiple endpoints!`);
      throw new BadRequestException(`Дубликат сообщения обнаружен. Сообщение уже обрабатывается через ${duplicateCheck.originalSource}. Подождите несколько секунд.`);
    }
    
    this.logger.log(`[${requestId}] Stack trace: ${new Error().stack}`);

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

    this.logger.log(`[${requestId}] Вызов eventMessagesRepository.createMessage`);
    const message = await this.eventMessagesRepository.createMessage(
      userId,
      eventId,
      dto,
    );
    
    // Update tracking with actual message ID
    const messageKey = `${userId}-${eventId}-${dto.text.substring(0, 50)}`;
    const existing = this.recentMessageAttempts.get(messageKey);
    if (existing) {
      existing.messageId = message.id;
    }
    
    this.logger.log(`[${requestId}] Сообщение создано/найдено в БД: messageId=${message.id}`);

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

        this.logger.log(`[${requestId}] ВЫЗОВ notifyEventMessagePosted для ${uniqueParticipantIds.length} участников`);
        await this.notificationEventService.notifyEventMessagePosted({
          eventId: event.id,
          eventTitle: event.title,
          eventType: event.type,
          messageText: dto.text,
          authorId: userId,
          authorName,
          participantIds: uniqueParticipantIds,
        });

        this.logger.log(
          `[${requestId}] Отправлено уведомление о новом сообщении в событии ${eventId} от пользователя ${userId}`,
        );
      }
    } catch (notificationError) {
      this.logger.error(
        `[${requestId}] Ошибка отправки уведомления о новом сообщении: ${notificationError.message}`,
      );
    }

    this.logger.log(`[${requestId}] ЗАВЕРШЕНИЕ createMessage: возвращаем messageId=${message.id}`);
    return message;
  }

  /**
   * LEGACY ENDPOINT - REFACTORED TO PREVENT DUPLICATE NOTIFICATIONS
   * 
   * ROOT CAUSE: This method used to have its own notification logic separate from createMessage(),
   * causing duplicate notifications when frontend called both endpoints.
   * 
   * SOLUTION: Now internally calls createMessage() to ensure unified notification pathway.
   * This prevents any possibility of duplicate notifications.
   */
  async addMessage(dto: AddMessageDto): Promise<EventMessage> {
    const requestId = `addMessage-unified-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.logger.log(`[${requestId}] addMessage() REFACTORED: converting to createMessage() call`);
    this.logger.log(`[${requestId}] Original request: userId=${dto.userId}, eventId=${dto.eventId}, text="${dto.text}"`);

    // Convert AddMessageDto to CreateMessageDto format
    const createMessageDto: CreateMessageDto = {
      text: dto.text
    };

    // Use the unified createMessage pathway to prevent duplicate notifications
    this.logger.log(`[${requestId}] Calling unified createMessage() instead of separate logic`);
    const result = await this.createMessage(dto.userId, dto.eventId, createMessageDto, 'HTTP-ADDMESSAGE-LEGACY');
    
    this.logger.log(`[${requestId}] addMessage() completed via createMessage(): messageId=${result.id}`);
    return result;
  }

  async markEventAsReadByDto(dto: MarkEventReadDto): Promise<void> {
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

    await this.eventMessagesRepository.markEventAsReadWithDto(
      dto.userId,
      dto.eventId,
    );
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
    // Нормализуем votingOptions (строка -> массив объектов)
    this.normalizeVotingOptions(dto);

    // Проверяем, действительно ли нужно голосование
    const needsVoting = this.isTrueBoolean(dto.hasVoting);

    // Валидация votingOptions только если нужно голосование
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

    // Подготавливаем данные с правильными булевыми значениями
    const eventData = {
      ...dto,
      hasVoting: needsVoting,
      hasMoneyCollection: this.isTrueBoolean(dto.hasMoneyCollection),
      createdBy: adminId,
      image: image?.filename || null,
      eventDateTime: dto.eventDateTime,
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
    // Нормализуем votingOptions (строка -> массив объектов)
    this.normalizeVotingOptions(dto);

    // Проверяем, действительно ли нужно голосование
    const needsVoting =
      dto.hasVoting !== undefined
        ? this.isTrueBoolean(dto.hasVoting)
        : undefined;

    // Валидация votingOptions только если включается голосование
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
}
