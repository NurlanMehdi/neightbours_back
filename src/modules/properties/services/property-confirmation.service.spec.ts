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

    const result = await service.confirmProperty(1, 10, '123456');
    expect(result).toBeDefined();
    expect(prisma.property.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({ verificationStatus: 'VERIFIED' }),
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
});
