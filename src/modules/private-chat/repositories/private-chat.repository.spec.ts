import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrivateChatRepository } from './private-chat.repository';
import { PrismaService } from '../../../prisma/prisma.service';

describe('PrivateChatRepository', () => {
  let repository: PrivateChatRepository;
  let prisma: any;

  beforeEach(async () => {
    const mockPrismaService = {
      users: {
        findUnique: jest.fn(),
      },
      conversation: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      conversationParticipant: {
        findMany: jest.fn(),
        createMany: jest.fn(),
      },
      privateMessage: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrivateChatRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<PrivateChatRepository>(PrivateChatRepository);
    prisma = module.get(PrismaService);
  });

  describe('createMessageWithAutoConversation', () => {
    it('should create new conversation and message when conversation does not exist', async () => {
      const mockReceiver = { id: 2, firstName: 'Петр', lastName: 'Иванов' };
      const mockConversation = { id: 1 };
      const mockMessage = {
        id: 10,
        conversationId: 1,
        senderId: 1,
        text: 'Привет!',
        sender: { id: 1, firstName: 'Иван', lastName: 'Петров' },
      };

      prisma.users.findUnique.mockResolvedValue(mockReceiver);

      prisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          conversation: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(mockConversation),
            update: jest.fn().mockResolvedValue(mockConversation),
          },
          conversationParticipant: {
            findMany: jest.fn().mockResolvedValue([]),
            createMany: jest.fn(),
          },
          privateMessage: {
            create: jest.fn().mockResolvedValue(mockMessage),
            findUnique: jest.fn(),
          },
        };
        return callback(tx);
      });

      const result = await repository.createMessageWithAutoConversation({
        senderId: 1,
        receiverId: 2,
        text: 'Привет!',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(10);
      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: 2 },
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should add message to existing conversation', async () => {
      const mockReceiver = { id: 2, firstName: 'Петр', lastName: 'Иванов' };
      const mockConversation = { id: 1 };
      const mockMessage = {
        id: 15,
        conversationId: 1,
        senderId: 1,
        text: 'Второе сообщение',
        sender: { id: 1, firstName: 'Иван', lastName: 'Петров' },
      };

      prisma.users.findUnique.mockResolvedValue(mockReceiver);

      prisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          conversation: {
            findUnique: jest.fn().mockResolvedValue(mockConversation),
            update: jest.fn().mockResolvedValue(mockConversation),
          },
          conversationParticipant: {
            findMany: jest
              .fn()
              .mockResolvedValue([{ userId: 1 }, { userId: 2 }]),
          },
          privateMessage: {
            create: jest.fn().mockResolvedValue(mockMessage),
            findUnique: jest.fn(),
          },
        };
        return callback(tx);
      });

      const result = await repository.createMessageWithAutoConversation({
        senderId: 1,
        receiverId: 2,
        text: 'Второе сообщение',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(15);
      expect(result.text).toBe('Второе сообщение');
    });

    it('should throw ForbiddenException when replying to message from another conversation', async () => {
      const mockReceiver = { id: 2, firstName: 'Петр', lastName: 'Иванов' };
      const mockConversation = { id: 1 };
      const mockRepliedMessage = { id: 5, conversationId: 99 };

      prisma.users.findUnique.mockResolvedValue(mockReceiver);

      prisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          conversation: {
            findUnique: jest.fn().mockResolvedValue(mockConversation),
            update: jest.fn(),
          },
          conversationParticipant: {
            findMany: jest
              .fn()
              .mockResolvedValue([{ userId: 1 }, { userId: 2 }]),
          },
          privateMessage: {
            findUnique: jest.fn().mockResolvedValue(mockRepliedMessage),
            create: jest.fn(),
          },
        };
        return callback(tx);
      });

      await expect(
        repository.createMessageWithAutoConversation({
          senderId: 1,
          receiverId: 2,
          text: 'Ответ',
          replyToMessageId: 5,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when replied message does not exist', async () => {
      const mockReceiver = { id: 2, firstName: 'Петр', lastName: 'Иванов' };
      const mockConversation = { id: 1 };

      prisma.users.findUnique.mockResolvedValue(mockReceiver);

      prisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          conversation: {
            findUnique: jest.fn().mockResolvedValue(mockConversation),
            update: jest.fn(),
          },
          conversationParticipant: {
            findMany: jest
              .fn()
              .mockResolvedValue([{ userId: 1 }, { userId: 2 }]),
          },
          privateMessage: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
        };
        return callback(tx);
      });

      await expect(
        repository.createMessageWithAutoConversation({
          senderId: 1,
          receiverId: 2,
          text: 'Ответ',
          replyToMessageId: 999,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when sender tries to message themselves', async () => {
      await expect(
        repository.createMessageWithAutoConversation({
          senderId: 1,
          receiverId: 1,
          text: 'Сообщение самому себе',
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.users.findUnique).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when receiverId is invalid', async () => {
      await expect(
        repository.createMessageWithAutoConversation({
          senderId: 1,
          receiverId: 0,
          text: 'Тест',
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        repository.createMessageWithAutoConversation({
          senderId: 1,
          receiverId: -5,
          text: 'Тест',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when receiver does not exist', async () => {
      prisma.users.findUnique.mockResolvedValue(null);

      await expect(
        repository.createMessageWithAutoConversation({
          senderId: 1,
          receiverId: 999,
          text: 'Сообщение несуществующему пользователю',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should correctly handle reply to message in same conversation', async () => {
      const mockReceiver = { id: 2, firstName: 'Петр', lastName: 'Иванов' };
      const mockConversation = { id: 1 };
      const mockRepliedMessage = { id: 5, conversationId: 1 };
      const mockMessage = {
        id: 20,
        conversationId: 1,
        senderId: 1,
        text: 'Ответ',
        replyToId: 5,
        sender: { id: 1, firstName: 'Иван', lastName: 'Петров' },
        replyTo: { id: 5, text: 'Исходное сообщение' },
      };

      prisma.users.findUnique.mockResolvedValue(mockReceiver);

      prisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          conversation: {
            findUnique: jest.fn().mockResolvedValue(mockConversation),
            update: jest.fn().mockResolvedValue(mockConversation),
          },
          conversationParticipant: {
            findMany: jest
              .fn()
              .mockResolvedValue([{ userId: 1 }, { userId: 2 }]),
          },
          privateMessage: {
            findUnique: jest.fn().mockResolvedValue(mockRepliedMessage),
            create: jest.fn().mockResolvedValue(mockMessage),
          },
        };
        return callback(tx);
      });

      const result = await repository.createMessageWithAutoConversation({
        senderId: 1,
        receiverId: 2,
        text: 'Ответ',
        replyToMessageId: 5,
      });

      expect(result).toBeDefined();
      expect(result.replyToId).toBe(5);
    });
  });
});
