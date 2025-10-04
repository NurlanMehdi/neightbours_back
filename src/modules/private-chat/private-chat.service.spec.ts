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
        replyToId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        sender: { id: 1, firstName: 'Иван', lastName: 'Петров', avatar: null },
        replyTo: null,
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
      expect(result.conversationId).toBe(1);
      expect(result.senderId).toBe(1);
      expect(result.text).toBe('Привет!');
      expect(result.replyToMessageId).toBeNull();
      expect(result.isDeleted).toBe(false);
      expect(result.user).toEqual({
        id: 1,
        firstName: 'Иван',
        lastName: 'Петров',
        avatar: null,
      });
      expect(result.replyTo).toBeNull();
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
        replyToId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        sender: { id: 1, firstName: 'Иван', lastName: 'Петров', avatar: null },
        replyTo: null,
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
      expect(result.conversationId).toBe(1);
      expect(result.senderId).toBe(1);
      expect(result.text).toBe('Ответ');
      expect(result.replyToMessageId).toBeNull();
      expect(result.isDeleted).toBe(false);
      expect(result.user).toEqual({
        id: 1,
        firstName: 'Иван',
        lastName: 'Петров',
        avatar: null,
      });
      expect(result.replyTo).toBeNull();
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
        createdAt: new Date(),
        updatedAt: new Date(),
        sender: { id: 1, firstName: 'Иван', lastName: 'Петров', avatar: null },
        replyTo: {
          id: 5,
          text: 'Исходное сообщение',
          senderId: 2,
          createdAt: new Date(),
          sender: { id: 2, firstName: 'Мария', lastName: 'Иванова', avatar: null },
        },
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
      expect(result.id).toBe(20);
      expect(result.conversationId).toBe(1);
      expect(result.senderId).toBe(1);
      expect(result.text).toBe('Ответ на сообщение');
      expect(result.replyToMessageId).toBe(5);
      expect(result.isDeleted).toBe(false);
      expect(result.user).toEqual({
        id: 1,
        firstName: 'Иван',
        lastName: 'Петров',
        avatar: null,
      });
      expect(result.replyTo).toEqual({
        id: 5,
        text: 'Исходное сообщение',
        senderId: 2,
        createdAt: expect.any(Date),
        user: {
          id: 2,
          firstName: 'Мария',
          lastName: 'Иванова',
          avatar: null,
        },
      });
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

  describe('getMessages', () => {
    it('should return messages in the correct format', async () => {
      const mockMessages = [
        {
          id: 1,
          conversationId: 1,
          senderId: 2,
          text: 'Hi! I\'m Jane, I live on Oak Avenue. Nice to meet you all!',
          replyToId: null,
          createdAt: new Date('2025-10-02T22:27:54.826Z'),
          updatedAt: new Date('2025-10-02T22:27:54.826Z'),
          sender: {
            id: 2,
            firstName: 'Jane',
            lastName: 'Smith',
            avatar: null,
          },
          replyTo: null,
        },
        {
          id: 2,
          conversationId: 1,
          senderId: 1,
          text: 'Reply message',
          replyToId: 1,
          createdAt: new Date('2025-10-02T22:28:00.000Z'),
          updatedAt: new Date('2025-10-02T22:28:00.000Z'),
          sender: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            avatar: 'avatar.jpg',
          },
          replyTo: {
            id: 1,
            text: 'Hi! I\'m Jane, I live on Oak Avenue. Nice to meet you all!',
            senderId: 2,
            createdAt: new Date('2025-10-02T22:27:54.826Z'),
            sender: {
              id: 2,
              firstName: 'Jane',
              lastName: 'Smith',
              avatar: null,
            },
          },
        },
      ];

      repo.ensureParticipant.mockResolvedValue({} as any);
      repo.getMessages.mockResolvedValue(mockMessages as any);

      const result = await service.getMessages(1, 1, 1, 50);

      expect(result).toHaveLength(2);
      
      // Check first message format
      expect(result[0]).toEqual({
        id: 1,
        conversationId: 1,
        senderId: 2,
        text: 'Hi! I\'m Jane, I live on Oak Avenue. Nice to meet you all!',
        replyToMessageId: null,
        createdAt: new Date('2025-10-02T22:27:54.826Z'),
        updatedAt: new Date('2025-10-02T22:27:54.826Z'),
        isDeleted: false,
        user: {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          avatar: null,
        },
        replyTo: null,
      });

      // Check second message with reply
      expect(result[1]).toEqual({
        id: 2,
        conversationId: 1,
        senderId: 1,
        text: 'Reply message',
        replyToMessageId: 1,
        createdAt: new Date('2025-10-02T22:28:00.000Z'),
        updatedAt: new Date('2025-10-02T22:28:00.000Z'),
        isDeleted: false,
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          avatar: 'avatar.jpg',
        },
        replyTo: {
          id: 1,
          text: 'Hi! I\'m Jane, I live on Oak Avenue. Nice to meet you all!',
          senderId: 2,
          createdAt: new Date('2025-10-02T22:27:54.826Z'),
          user: {
            id: 2,
            firstName: 'Jane',
            lastName: 'Smith',
            avatar: null,
          },
        },
      });

      expect(repo.ensureParticipant).toHaveBeenCalledWith(1, 1);
      expect(repo.getMessages).toHaveBeenCalledWith(1, 1, 50);
    });
  });
});
