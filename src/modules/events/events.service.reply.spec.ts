import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { EventsRepository } from './repositories/events.repository';
import { EventMessagesRepository } from './repositories/event-messages.repository';
import { VotingRepository } from './repositories/voting.repository';
import { NotificationEventService } from '../notifications/services/notification-event.service';
import { UserService } from '../users/services/user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UnifiedMessageNotificationService } from './services/unified-message-notification.service';

describe('EventsService message replies', () => {
  let service: EventsService;
  let eventMessages: jest.Mocked<EventMessagesRepository>;
  let eventsRepo: jest.Mocked<EventsRepository>;
  let prisma: jest.Mocked<PrismaService>;
  let userService: jest.Mocked<UserService>;
  let unified: jest.Mocked<UnifiedMessageNotificationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: EventsRepository,
          useValue: { findById: jest.fn(), isUserInCommunity: jest.fn() },
        },
        {
          provide: EventMessagesRepository,
          useValue: {
            createMessage: jest.fn(),
            addMessage: jest.fn(),
            getEventMessages: jest.fn(),
          },
        },
        { provide: VotingRepository, useValue: {} },
        { provide: NotificationEventService, useValue: {} },
        { provide: UserService, useValue: { findById: jest.fn() } },
        {
          provide: PrismaService,
          useValue: { event: { findUnique: jest.fn() } },
        },
        {
          provide: UnifiedMessageNotificationService,
          useValue: { processMessageNotification: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(EventsService);
    eventMessages = module.get(EventMessagesRepository) as any;
    eventsRepo = module.get(EventsRepository) as any;
    prisma = module.get(PrismaService) as any;
    userService = module.get(UserService) as any;
    unified = module.get(UnifiedMessageNotificationService) as any;
  });

  it('creates message with replyToMessageId', async () => {
    eventsRepo.findById.mockResolvedValue({
      id: 7,
      communityId: 3,
      title: 't',
      type: 'EVENT',
    } as any);
    eventsRepo.isUserInCommunity.mockResolvedValue(true);
    userService.findById.mockResolvedValue({
      firstName: 'A',
      lastName: 'B',
    } as any);
    (prisma.event.findUnique as any).mockResolvedValue({
      participants: [],
      creator: { id: 1 },
    });
    (eventMessages.createMessage as any).mockImplementation(
      async (_userId: number, _eventId: number, dto: any) => ({
        id: 77,
        replyToMessageId: dto.replyToMessageId,
      }),
    );

    const res: any = await service.createMessage(1, 7, {
      text: 'hello',
      replyToMessageId: 10,
    } as any);
    expect((res as any).replyToMessageId).toBe(10);
    expect(eventMessages.createMessage).toHaveBeenCalledWith(
      1,
      7,
      expect.objectContaining({ replyToMessageId: 10 }),
    );
    expect(unified.processMessageNotification).toHaveBeenCalled();
  });
});
