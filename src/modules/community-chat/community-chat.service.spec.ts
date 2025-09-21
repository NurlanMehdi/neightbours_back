import { Test, TestingModule } from '@nestjs/testing';
import { CommunityChatService } from './community-chat.service';
import { CommunityChatRepository } from './repositories/community-chat.repository';
import { NotificationService } from '../notifications/services/notification.service';
import { CommunityChatGateway } from './community-chat.gateway';

describe('CommunityChatService', () => {
  let service: CommunityChatService;
  let repo: jest.Mocked<CommunityChatRepository>;
  let notifications: jest.Mocked<NotificationService>;
  let gateway: jest.Mocked<CommunityChatGateway>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityChatService,
        {
          provide: CommunityChatRepository,
          useValue: {
            isMember: jest.fn(),
            isAdmin: jest.fn(),
            ensureChatExists: jest.fn(),
            createChat: jest.fn(),
            deleteChat: jest.fn(),
            updateSettings: jest.fn(),
            createMessage: jest.fn(),
            getMessages: jest.fn(),
            deleteMessage: jest.fn(),
            markAsRead: jest.fn(),
            searchMessages: jest.fn(),
            getMemberIds: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: { createGlobalNotification: jest.fn() },
        },
        {
          provide: CommunityChatGateway,
          useValue: { broadcastNewMessage: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(CommunityChatService);
    repo = module.get(CommunityChatRepository) as any;
    notifications = module.get(NotificationService) as any;
    gateway = module.get(CommunityChatGateway) as any;
  });

  it('should send a message and notify members', async () => {
    repo.isMember.mockResolvedValue(true);
    repo.ensureChatExists.mockResolvedValue({ id: 1 } as any);
    repo.createMessage.mockResolvedValue({ id: 10, communityId: 5, userId: 1, text: 'hi', user: { firstName: 'A', lastName: 'B' } } as any);
    repo.getMemberIds.mockResolvedValue([1, 2, 3]);

    const res = await service.sendMessage(1, 5, { text: 'hi' });
    expect(res.id).toBe(10);
    expect(notifications.createGlobalNotification).toHaveBeenCalled();
    expect(gateway.broadcastNewMessage).toHaveBeenCalledWith(5, expect.any(Object));
  });

  it('should mark messages as read', async () => {
    repo.isMember.mockResolvedValue(true);
    repo.markAsRead.mockResolvedValue({ readAt: new Date() });

    const res = await service.markAsRead(2, 5, 100);
    expect(res.readAt).toBeInstanceOf(Date);
  });

  it('should send a reply message', async () => {
    repo.isMember.mockResolvedValue(true);
    repo.ensureChatExists.mockResolvedValue({ id: 1 } as any);
    repo.createMessage.mockImplementation(async (p: any) => ({ id: 11, communityId: p.communityId, userId: p.userId, text: p.text, replyToMessageId: p.replyToMessageId, user: {} } as any));
    repo.getMemberIds.mockResolvedValue([1, 2]);

    const res = await service.sendMessage(1, 5, { text: 'reply', replyToMessageId: 10 });
    expect(res.replyToMessageId).toBe(10);
    expect(repo.createMessage).toHaveBeenCalledWith(expect.objectContaining({ replyToMessageId: 10 }));
  });

  it('should delete message', async () => {
    repo.isMember.mockResolvedValue(true);
    repo.deleteMessage.mockResolvedValue();

    await service.deleteMessage(1, 5, 50);
    expect(repo.deleteMessage).toHaveBeenCalledWith(50, 1);
  });

  it('admin can create and delete conversation', async () => {
    repo.isAdmin.mockResolvedValue(true);
    repo.createChat.mockResolvedValue({ id: 1, communityId: 5 } as any);
    const chat = await service.createConversation(99, 5);
    expect(chat).toBeDefined();
    await service.deleteConversation(99, 5);
    expect(repo.deleteChat).toHaveBeenCalledWith(5);
  });
});
