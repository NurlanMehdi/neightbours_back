import { Test, TestingModule } from '@nestjs/testing';
import { PrivateChatService } from './private-chat.service';
import { PrivateChatRepository } from './repositories/private-chat.repository';
import { NotificationService } from '../notifications/services/notification.service';

describe('PrivateChatService', () => {
  let service: PrivateChatService;
  let repo: jest.Mocked<PrivateChatRepository>;
  let notifications: jest.Mocked<NotificationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrivateChatService,
        {
          provide: PrivateChatRepository,
          useValue: {
            getOrCreateConversation: jest.fn(),
            ensureParticipant: jest.fn(),
            findConversationById: jest.fn(),
            createMessage: jest.fn(),
            getMessages: jest.fn(),
            getConversationList: jest.fn(),
            countUnread: jest.fn(),
            markAsRead: jest.fn(),
            searchMessages: jest.fn(),
            findMessageById: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            createGlobalNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PrivateChatService>(PrivateChatService);
    repo = module.get(PrivateChatRepository) as any;
    notifications = module.get(NotificationService) as any;
  });

  it('should send message and trigger push notification', async () => {
    repo.getOrCreateConversation.mockResolvedValue({ id: 1, participants: [{ userId: 1 }, { userId: 2 }] } as any);
    repo.ensureParticipant.mockResolvedValue({} as any);
    repo.createMessage.mockResolvedValue({ id: 10, conversationId: 1, senderId: 1, text: 'hi' } as any);
    repo.findConversationById.mockResolvedValue({ id: 1, participants: [{ userId: 1 }, { userId: 2 }] } as any);

    const res = await service.sendMessage(1, { receiverId: 2, text: 'hi' });

    expect(res).toBeDefined();
    expect(repo.createMessage).toHaveBeenCalled();
    expect(notifications.createGlobalNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'MESSAGE_RECEIVED', userId: 2 }),
    );
  });

  it('should build conversation list with unread counts', async () => {
    repo.getConversationList.mockResolvedValue([
      {
        id: 1,
        updatedAt: new Date(),
        participants: [{ userId: 1 }, { userId: 2, user: { id: 2 } }],
        messages: [{ id: 1 }],
      },
    ] as any);
    repo.countUnread.mockResolvedValue(3);

    const list = await service.getConversationList(1);
    expect(list).toHaveLength(1);
    expect(list[0].unreadCount).toBe(3);
  });

  it('should mark messages as read', async () => {
    repo.ensureParticipant.mockResolvedValue({} as any);
    repo.markAsRead.mockResolvedValue({ updated: 2, readAt: new Date() });

    const res = await service.markAsRead(1, 1);
    expect(res.updated).toBe(2);
  });
});

