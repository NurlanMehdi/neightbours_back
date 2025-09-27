import { PropertyConfirmationService } from './property-confirmation.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PropertyRepository } from '../repositories/property.repository';

describe('PropertyConfirmationService', () => {
  let service: PropertyConfirmationService;
  let prisma: any;
  let repo: any;
  const notificationService: any = { createNotification: jest.fn() };

  beforeEach(() => {
    prisma = {
      property: {
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      propertyVerification: {
        upsert: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback({
        property: prisma.property,
        propertyVerification: prisma.propertyVerification,
      })),
    } as any;

    repo = {
      findById: jest.fn(),
      findByIdWithVerifications: jest.fn(),
    } as any;

    service = new PropertyConfirmationService(prisma as any, repo as any, notificationService as any);
  });

  it('confirms property with valid code -> VERIFIED', async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    const mockProperty = { 
      id: 1, 
      isActive: true, 
      verificationStatus: 'UNVERIFIED', 
      userId: 10, 
      confirmationCode: '123456', 
      confirmationCodeExpiresAt: expiresAt,
      name: 'Test Property',
      category: 'PRIVATE_HOUSE',
      latitude: 55.7558,
      longitude: 37.6176,
      photo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { firstName: 'John', lastName: 'Doe' },
      verifications: []
    } as any;
    
    (repo.findById as any).mockResolvedValue(mockProperty);
    (repo.findByIdWithVerifications as any).mockResolvedValue(mockProperty);
    (prisma.property.update as any).mockResolvedValue({});
    (prisma.propertyVerification.upsert as any).mockResolvedValue({});
    (prisma.propertyVerification.count as any).mockResolvedValue(1);

    const result = await service.confirmProperty(1, 10, '123456');
    expect(result).toBeDefined();
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.propertyVerification.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          propertyId_userId: {
            propertyId: 1,
            userId: 10,
          },
        },
        create: {
          propertyId: 1,
          userId: 10,
        },
      }),
    );
    expect(prisma.propertyVerification.count).toHaveBeenCalledWith({
      where: { propertyId: 1 },
    });
    expect(prisma.property.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({ verificationStatus: 'UNVERIFIED' }),
      }),
    );
  });

  it('throws error on wrong code', async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    (repo.findById as any).mockResolvedValue({ id: 1, isActive: true, verificationStatus: 'UNVERIFIED', userId: 10, confirmationCode: '999999', confirmationCodeExpiresAt: expiresAt } as any);
    await expect(service.confirmProperty(1, 10, '000000')).rejects.toBeTruthy();
  });

  it('cleanupExpiredProperties deletes UNVERIFIED with expired codes', async () => {
    (prisma.property.deleteMany as any).mockResolvedValue({ count: 2 } as any);
    const count = await service.cleanupExpiredProperties();
    expect(count).toBe(2);
    expect(prisma.property.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ verificationStatus: 'UNVERIFIED' }),
      }),
    );
  });

  describe('Verification counting logic', () => {
    const expiresAt = new Date(Date.now() + 60_000);
    const mockProperty = {
      id: 1,
      isActive: true,
      verificationStatus: 'UNVERIFIED',
      userId: 10,
      confirmationCode: '123456',
      confirmationCodeExpiresAt: expiresAt,
      name: 'Test Property',
      category: 'PRIVATE_HOUSE',
      latitude: 55.7558,
      longitude: 37.6176,
      photo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { firstName: 'John', lastName: 'Doe' },
      verifications: [],
    } as any;

    beforeEach(() => {
      (repo.findById as any).mockResolvedValue(mockProperty);
      (repo.findByIdWithVerifications as any).mockResolvedValue(mockProperty);
      (prisma.property.update as any).mockResolvedValue({});
      (prisma.propertyVerification.upsert as any).mockResolvedValue({});
    });

    it('Case 1: First confirmation - keeps UNVERIFIED status', async () => {
      (prisma.propertyVerification.count as any).mockResolvedValue(1);

      await service.confirmProperty(1, 10, '123456');

      expect(prisma.propertyVerification.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            propertyId_userId: {
              propertyId: 1,
              userId: 10,
            },
          },
          create: {
            propertyId: 1,
            userId: 10,
          },
        }),
      );
      expect(prisma.propertyVerification.count).toHaveBeenCalledWith({
        where: { propertyId: 1 },
      });
      expect(prisma.property.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { verificationStatus: 'UNVERIFIED' },
        }),
      );
    });

    it('Case 2: Second unique user confirmation - sets VERIFIED status', async () => {
      (prisma.propertyVerification.count as any).mockResolvedValue(2);

      await service.confirmProperty(1, 20, '123456');

      expect(prisma.propertyVerification.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            propertyId_userId: {
              propertyId: 1,
              userId: 20,
            },
          },
          create: {
            propertyId: 1,
            userId: 20,
          },
        }),
      );
      expect(prisma.propertyVerification.count).toHaveBeenCalledWith({
        where: { propertyId: 1 },
      });
      expect(prisma.property.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { verificationStatus: 'VERIFIED' },
        }),
      );
    });

    it('Case 3: Duplicate confirmation from same user - no status change', async () => {
      (prisma.propertyVerification.count as any).mockResolvedValue(1);

      await service.confirmProperty(1, 10, '123456');

      expect(prisma.propertyVerification.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            propertyId_userId: {
              propertyId: 1,
              userId: 10,
            },
          },
          create: {
            propertyId: 1,
            userId: 10,
          },
        }),
      );
      expect(prisma.propertyVerification.count).toHaveBeenCalledWith({
        where: { propertyId: 1 },
      });
      expect(prisma.property.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { verificationStatus: 'UNVERIFIED' },
        }),
      );
    });
  });
});
