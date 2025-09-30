import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrivateChatService } from './private-chat.service';
import { PrivateChatRepository } from './repositories/private-chat.repository';
import { NotificationService } from '../notifications/services/notification.service';
import { GlobalChatSettingsService } from '../chat-admin/services/global-chat-settings.service';

describe('PrivateChatService', () => {
  let service: PrivateChatService;
  let repo: jest.Mocked<PrivateChatRepository>;
  let notifications: jest.Mocked<NotificationService>;
  let globalChatSettings: jest.Mocked<GlobalChatSettingsService>;

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
            createMessageWithAutoConversation: jest.fn(),
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
        {
          provide: GlobalChatSettingsService,
          useValue: {
            isPrivateChatAllowed: jest.fn().mockResolvedValue(true),
            getMaxMessageLength: jest.fn().mockResolvedValue(1000),
          },
        },
      ],
    }).compile();

    service = module.get<PrivateChatService>(PrivateChatService);
    repo = module.get(PrivateChatRepository) as any;
    notifications = module.get(NotificationService) as any;
    globalChatSettings = module.get(GlobalChatSettingsService) as any;
  });

  describe('sendMessage', () => {
    it('should auto-create conversation when sending first message via receiverId', async () => {
      const mockMessage = {
        id: 10,
        conversationId: 1,
        senderId: 1,
        text: 'Привет!',
        sender: { id: 1, firstName: 'Иван', lastName: 'Петров' },
      };

      repo.createMessageWithAutoConversation.mockResolvedValue(
        mockMessage as any,
      );
      repo.findConversationById.mockResolvedValue({
        id: 1,
        participants: [{ userId: 1 }, { userId: 2 }],
      } as any);

      const result = await service.sendMessage(1, {
        receiverId: 2,
        text: 'Привет!',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(10);
      expect(repo.createMessageWithAutoConversation).toHaveBeenCalledWith({
        senderId: 1,
        receiverId: 2,
        text: 'Привет!',
        replyToMessageId: undefined,
      });
      expect(notifications.createGlobalNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'MESSAGE_RECEIVED', userId: [2] }),
      );
    });

    it('should send message to existing conversation via conversationId', async () => {
      const mockMessage = {
        id: 15,
        conversationId: 1,
        senderId: 1,
        text: 'Ответ',
        sender: { id: 1, firstName: 'Иван', lastName: 'Петров' },
      };

      repo.ensureParticipant.mockResolvedValue({} as any);
      repo.createMessage.mockResolvedValue(mockMessage as any);
      repo.findConversationById.mockResolvedValue({
        id: 1,
        participants: [{ userId: 1 }, { userId: 2 }],
      } as any);

      const result = await service.sendMessage(1, {
        conversationId: 1,
        text: 'Ответ',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(15);
      expect(repo.ensureParticipant).toHaveBeenCalledWith(1, 1);
      expect(repo.createMessage).toHaveBeenCalledWith({
        conversationId: 1,
        senderId: 1,
        text: 'Ответ',
        replyToId: undefined,
      });
    });

    it('should handle replyToId with auto-conversation creation', async () => {
      const mockMessage = {
        id: 20,
        conversationId: 1,
        senderId: 1,
        text: 'Ответ на сообщение',
        replyToId: 5,
        sender: { id: 1, firstName: 'Иван', lastName: 'Петров' },
        replyTo: { id: 5, text: 'Исходное сообщение' },
      };

      repo.createMessageWithAutoConversation.mockResolvedValue(
        mockMessage as any,
      );
      repo.findConversationById.mockResolvedValue({
        id: 1,
        participants: [{ userId: 1 }, { userId: 2 }],
      } as any);

      const result = await service.sendMessage(1, {
        receiverId: 2,
        text: 'Ответ на сообщение',
        replyToId: 5,
      });

      expect(result).toBeDefined();
      expect(result.replyToId).toBe(5);
      expect(repo.createMessageWithAutoConversation).toHaveBeenCalledWith({
        senderId: 1,
        receiverId: 2,
        text: 'Ответ на сообщение',
        replyToMessageId: 5,
      });
    });

    it('should throw ForbiddenException when replying to message from another conversation', async () => {
      repo.ensureParticipant.mockResolvedValue({} as any);
      repo.findMessageById.mockResolvedValue({
        id: 5,
        conversationId: 99,
        text: 'Сообщение из другого диалога',
      } as any);

      await expect(
        service.sendMessage(1, {
          conversationId: 1,
          text: 'Ответ',
          replyToId: 5,
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(repo.findMessageById).toHaveBeenCalledWith(5);
      expect(repo.createMessage).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when message is too long', async () => {
      globalChatSettings.getMaxMessageLength.mockResolvedValue(100);
      const longText = 'a'.repeat(101);

      await expect(
        service.sendMessage(1, { receiverId: 2, text: longText }),
      ).rejects.toThrow(BadRequestException);

      expect(repo.createMessageWithAutoConversation).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when private chats are disabled', async () => {
      globalChatSettings.isPrivateChatAllowed.mockResolvedValue(false);

      await expect(
        service.sendMessage(1, { receiverId: 2, text: 'Привет' }),
      ).rejects.toThrow(ForbiddenException);

      expect(repo.createMessageWithAutoConversation).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when neither conversationId nor receiverId provided', async () => {
      await expect(service.sendMessage(1, { text: 'Привет' })).rejects.toThrow(
        BadRequestException,
      );
    });
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
