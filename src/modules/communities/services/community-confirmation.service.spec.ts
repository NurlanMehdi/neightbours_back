import { Test, TestingModule } from '@nestjs/testing';
import { CommunityConfirmationService } from './community-confirmation.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationEventService } from '../../notifications/services/notification-event.service';
import { CommunityConfirmationConfig } from '../config/community-confirmation.config';

describe('CommunityConfirmationService', () => {
  let service: CommunityConfirmationService;
  let prismaService: PrismaService;
  let notificationService: NotificationEventService;

  const mockPrismaService = {
    community: {
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockNotificationService = {
    notifyCommunityStatusChange: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityConfirmationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NotificationEventService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    service = module.get<CommunityConfirmationService>(CommunityConfirmationService);
    prismaService = module.get<PrismaService>(PrismaService);
    notificationService = module.get<NotificationEventService>(NotificationEventService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateConfirmationDeadline', () => {
    it('should return deadline 24 hours from now', () => {
      const deadline = service.calculateConfirmationDeadline();
      const now = new Date();
      const expectedDeadline = new Date(now.getTime() + CommunityConfirmationConfig.confirmationHours * 60 * 60 * 1000);
      
      expect(deadline.getTime()).toBeCloseTo(expectedDeadline.getTime(), -2);
    });
  });

  describe('activateCommunity', () => {
    it('should activate community and send notification', async () => {
      const communityId = 1;
      const creatorId = 2;

      mockPrismaService.community.update.mockResolvedValue({ id: communityId });
      mockNotificationService.notifyCommunityStatusChange.mockResolvedValue(undefined);

      await service.activateCommunity(communityId, creatorId);

      expect(mockPrismaService.community.update).toHaveBeenCalledWith({
        where: { id: communityId },
        data: {
          status: 'ACTIVE',
          isActive: true,
          confirmedAt: expect.any(Date),
          confirmationDeadline: null,
        },
      });

      expect(mockNotificationService.notifyCommunityStatusChange).toHaveBeenCalledWith({
        userId: creatorId,
        communityId,
        status: 'ACTIVE',
        type: 'COMMUNITY_APPROVED',
      });
    });
  });

  describe('rejectCommunity', () => {
    it('should reject community and send notification', async () => {
      const communityId = 1;
      const creatorId = 2;

      mockPrismaService.community.delete.mockResolvedValue({ id: communityId });
      mockNotificationService.notifyCommunityStatusChange.mockResolvedValue(undefined);

      await service.rejectCommunity(communityId, creatorId);

      expect(mockNotificationService.notifyCommunityStatusChange).toHaveBeenCalledWith({
        userId: creatorId,
        communityId,
        status: 'REJECTED',
        type: 'COMMUNITY_REJECTED',
      });

      expect(mockPrismaService.community.delete).toHaveBeenCalledWith({
        where: { id: communityId },
      });
    });
  });

  describe('processExpiredCommunities', () => {
    it('should activate community when enough members joined', async () => {
      const expiredCommunities = [
        {
          id: 1,
          createdBy: 2,
          users: [
            { userId: 3, joinedViaCode: true },
            { userId: 4, joinedViaCode: true },
          ],
        },
      ];

      mockPrismaService.community.findMany.mockResolvedValue(expiredCommunities);
      mockPrismaService.community.update.mockResolvedValue({ id: 1 });
      mockNotificationService.notifyCommunityStatusChange.mockResolvedValue(undefined);

      await service.processExpiredCommunities();

      expect(mockPrismaService.community.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: 'ACTIVE',
          isActive: true,
          confirmedAt: expect.any(Date),
          confirmationDeadline: null,
        },
      });

      expect(mockNotificationService.notifyCommunityStatusChange).toHaveBeenCalledWith({
        userId: 2,
        communityId: 1,
        status: 'ACTIVE',
        type: 'COMMUNITY_APPROVED',
      });
    });

    it('should reject community when not enough members joined', async () => {
      const expiredCommunities = [
        {
          id: 1,
          createdBy: 2,
          users: [
            { userId: 3, joinedViaCode: true },
          ],
        },
      ];

      mockPrismaService.community.findMany.mockResolvedValue(expiredCommunities);
      mockPrismaService.community.delete.mockResolvedValue({ id: 1 });
      mockNotificationService.notifyCommunityStatusChange.mockResolvedValue(undefined);

      await service.processExpiredCommunities();

      expect(mockNotificationService.notifyCommunityStatusChange).toHaveBeenCalledWith({
        userId: 2,
        communityId: 1,
        status: 'REJECTED',
        type: 'COMMUNITY_REJECTED',
      });

      expect(mockPrismaService.community.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('adminConfirmCommunity', () => {
    it('should confirm community by admin', async () => {
      const communityId = 1;
      const adminId = 2;
      const community = { createdBy: 3 };

      mockPrismaService.community.findUnique.mockResolvedValue(community);
      mockPrismaService.community.update.mockResolvedValue({ id: communityId });
      mockNotificationService.notifyCommunityStatusChange.mockResolvedValue(undefined);

      await service.adminConfirmCommunity(communityId, adminId);

      expect(mockPrismaService.community.update).toHaveBeenCalledWith({
        where: { id: communityId },
        data: {
          status: 'ACTIVE',
          isActive: true,
          confirmedAt: expect.any(Date),
          confirmationDeadline: null,
        },
      });

      expect(mockNotificationService.notifyCommunityStatusChange).toHaveBeenCalledWith({
        userId: 3,
        communityId,
        status: 'ACTIVE',
        type: 'COMMUNITY_APPROVED',
      });
    });

    it('should throw error when community not found', async () => {
      const communityId = 1;
      const adminId = 2;

      mockPrismaService.community.findUnique.mockResolvedValue(null);

      await expect(service.adminConfirmCommunity(communityId, adminId))
        .rejects.toThrow('Сообщество не найдено');
    });
  });
});
