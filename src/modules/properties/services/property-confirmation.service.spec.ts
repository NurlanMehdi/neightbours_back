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
    } as any;

    service = new PropertyConfirmationService(prisma as any, repo as any, notificationService as any);
  });

  it('confirms property with valid code -> VERIFIED', async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    (repo.findById as any).mockResolvedValue({ id: 1, isActive: true, verificationStatus: 'UNVERIFIED', userId: 10, confirmationCode: '123456', confirmationCodeExpiresAt: expiresAt } as any);
    (prisma.property.update as any).mockResolvedValue({});

    await expect(service.confirmProperty(1, '123456')).resolves.toBeUndefined();
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
    await expect(service.confirmProperty(1, '000000')).rejects.toBeTruthy();
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
