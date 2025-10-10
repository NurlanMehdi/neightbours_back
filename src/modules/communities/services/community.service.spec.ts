import { Test, TestingModule } from '@nestjs/testing';
import { CommunityService } from './community.service';
import { CommunityRepository } from '../repositories/community.repository';
import { GeoModerationService } from '../../geo-moderation/services/geo-moderation.service';
import { NotificationEventService } from '../../notifications/services/notification-event.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { CommunityConfirmationService } from './community-confirmation.service';
import { BadRequestException } from '@nestjs/common';

describe('CommunityService', () => {
  let service: CommunityService;
  let communityRepository: CommunityRepository;
  let confirmationService: CommunityConfirmationService;

  const mockCommunityRepository = {
    addUser: jest.fn(),
    findByJoinCode: jest.fn(),
    countMembersJoinedViaCode: jest.fn(),
    findById: jest.fn(),
  };

  const mockConfirmationService = {
    calculateConfirmationDeadline: jest.fn(),
    activateCommunity: jest.fn(),
    adminConfirmCommunity: jest.fn(),
  };

  const mockPrismaService = {
    community: {
      create: jest.fn(),
    },
    users: {
      findUnique: jest.fn(),
    },
  };

  const mockGeoModerationService = {
    checkCommunityJoin: jest.fn(),
    throwGeoModerationError: jest.fn(),
  };

  const mockNotificationService = {
    notifyUserJoinedCommunityToMembers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityService,
        {
          provide: CommunityRepository,
          useValue: mockCommunityRepository,
        },
        {
          provide: GeoModerationService,
          useValue: mockGeoModerationService,
        },
        {
          provide: NotificationEventService,
          useValue: mockNotificationService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CommunityConfirmationService,
          useValue: mockConfirmationService,
        },
      ],
    }).compile();

    service = module.get<CommunityService>(CommunityService);
    communityRepository = module.get<CommunityRepository>(CommunityRepository);
    confirmationService = module.get<CommunityConfirmationService>(CommunityConfirmationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCommunity', () => {
    it('should create community with INACTIVE status and confirmation deadline', async () => {
      const userId = 1;
      const name = 'Test Community';
      const latitude = 55.7558;
      const longitude = 37.6176;
      const deadline = new Date();

      mockConfirmationService.calculateConfirmationDeadline.mockReturnValue(deadline);
      mockPrismaService.community.create.mockResolvedValue({
        id: 1,
        name,
        status: 'INACTIVE',
        joinCode: '123456',
        confirmationDeadline: deadline,
      });

      const result = await service.createCommunity(userId, name, latitude, longitude);

      expect(mockPrismaService.community.create).toHaveBeenCalledWith({
        data: {
          name,
          createdBy: userId,
          latitude,
          longitude,
          status: 'INACTIVE',
          isActive: true, // true = видимо, false = мягко удалено
          joinCode: expect.any(String),
          confirmationDeadline: deadline,
        },
      });

      // Создатель НЕ добавляется как участник сообщества автоматически
      expect(mockCommunityRepository.addUser).not.toHaveBeenCalled();
      expect(result.status).toBe('INACTIVE');
      expect(result.confirmationDeadline).toBe(deadline);
    });
  });

  describe('joinCommunity', () => {
    it('should join community and activate if enough members', async () => {
      const userId = 2;
      const code = '123456';
      const community = {
        id: 1,
        name: 'Test Community',
        status: 'INACTIVE',
        createdBy: 1,
        latitude: 55.7558,
        longitude: 37.6176,
      };

      mockCommunityRepository.findByJoinCode.mockResolvedValue(community);
      mockGeoModerationService.checkCommunityJoin.mockResolvedValue({ allowed: true });
      mockCommunityRepository.addUser.mockResolvedValue(undefined);
      mockCommunityRepository.countMembersJoinedViaCode.mockResolvedValue(2);
      mockConfirmationService.activateCommunity.mockResolvedValue(undefined);
      mockPrismaService.users.findUnique.mockResolvedValue({
        firstName: 'John',
        lastName: 'Doe',
      });
      mockNotificationService.notifyUserJoinedCommunityToMembers.mockResolvedValue(undefined);

      const result = await service.joinCommunity(userId, code);

      expect(mockCommunityRepository.addUser).toHaveBeenCalledWith(1, userId, true);
      expect(mockConfirmationService.activateCommunity).toHaveBeenCalledWith(1, 1);
      expect(result.joinedCount).toBe(2);
      expect(result.requiredCount).toBe(2);
    });

    it('should throw error for invalid code', async () => {
      const userId = 2;
      const code = 'invalid';

      mockCommunityRepository.findByJoinCode.mockResolvedValue(null);

      await expect(service.joinCommunity(userId, code))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('adminConfirmCommunity', () => {
    it('should confirm community by admin', async () => {
      const communityId = 1;
      const adminId = 2;
      const community = { id: 1 };

      mockCommunityRepository.findById.mockResolvedValue(community);
      mockConfirmationService.adminConfirmCommunity.mockResolvedValue(undefined);

      await service.adminConfirmCommunity(communityId, adminId);

      expect(mockConfirmationService.adminConfirmCommunity).toHaveBeenCalledWith(communityId, adminId);
    });

    it('should throw error when community not found', async () => {
      const communityId = 1;
      const adminId = 2;

      mockCommunityRepository.findById.mockResolvedValue(null);

      await expect(service.adminConfirmCommunity(communityId, adminId))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getConfirmationStatus', () => {
    it('should return confirmation status', async () => {
      const communityId = 1;
      const community = {
        id: 1,
        status: 'INACTIVE',
        createdBy: 1,
        confirmationDeadline: new Date(),
        confirmedAt: null,
      };

      mockCommunityRepository.findById.mockResolvedValue(community);
      mockCommunityRepository.countMembersJoinedViaCode.mockResolvedValue(1);

      const result = await service.getConfirmationStatus(communityId);

      expect(result.status).toBe('INACTIVE');
      expect(result.joinedCount).toBe(1);
      expect(result.requiredCount).toBe(2);
      expect(result.deadline).toBe(community.confirmationDeadline);
    });
  });
});
