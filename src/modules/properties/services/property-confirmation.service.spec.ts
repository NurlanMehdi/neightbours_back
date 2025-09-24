import { PropertyConfirmationService } from './property-confirmation.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PropertyRepository } from '../repositories/property.repository';

describe('PropertyConfirmationService', () => {
  let service: PropertyConfirmationService;
  let prisma: jest.Mocked<PrismaService>;
  let repo: jest.Mocked<PropertyRepository>;

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

    service = new PropertyConfirmationService(prisma as any, repo as any);
  });

  it('generates a confirmation code and expiry', async () => {
    repo.findById.mockResolvedValue({ id: 1, userId: 10, isActive: true, confirmationStatus: 'PENDING' });
    prisma.property.update.mockResolvedValue({});

    const res = await service.generateConfirmationCode(1, 10);
    expect(res.code).toHaveLength(6);
    expect(typeof res.code).toBe('string');
    expect(res.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(prisma.property.update).toHaveBeenCalled();
  });

  it('confirms property with valid code', async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    repo.findById.mockResolvedValue({ id: 1, isActive: true, confirmationStatus: 'PENDING', confirmationCode: '123456', confirmationCodeExpiresAt: expiresAt });
    prisma.property.update.mockResolvedValue({});

    await expect(service.confirmProperty(1, '123456')).resolves.toBeUndefined();
    expect(prisma.property.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({ confirmationStatus: 'CONFIRMED' }),
      }),
    );
  });

  it('cleanupExpiredProperties deletes old unconfirmed', async () => {
    prisma.property.deleteMany.mockResolvedValue({ count: 2 } as any);
    const count = await service.cleanupExpiredProperties();
    expect(count).toBe(2);
    expect(prisma.property.deleteMany).toHaveBeenCalled();
  });
});

