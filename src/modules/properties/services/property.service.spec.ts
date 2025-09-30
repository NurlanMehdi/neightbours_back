import { PropertyService } from './property.service';
import { PropertyRepository } from '../repositories/property.repository';
import { UserRepository } from '../../users/repositories/user.repository';
import { GeoModerationService } from '../../geo-moderation/services/geo-moderation.service';
import { NotificationService } from '../../notifications/services/notification.service';
import { PropertyConfirmationService } from './property-confirmation.service';

describe('PropertyService (confirmation code on create)', () => {
  let service: PropertyService;
  let propertyRepository: any;
  let userRepository: any;
  let geoService: any;
  const notificationService: any = { createNotification: jest.fn() };
  const confirmationService: any = { confirmProperty: jest.fn() };

  beforeEach(() => {
    propertyRepository = {
      create: jest.fn(async (data: any) => ({ id: 1, ...data })),
    } as Partial<PropertyRepository> as any;
    userRepository = {
      findById: jest.fn().mockResolvedValue({ id: 1 }),
    } as Partial<UserRepository> as any;
    geoService = {
      checkPropertyCreation: jest.fn().mockResolvedValue({ allowed: true }),
    } as Partial<GeoModerationService> as any;

    service = new PropertyService(
      propertyRepository,
      userRepository,
      geoService,
      notificationService,
      confirmationService,
    );
  });

  it('auto-generates 6-digit code and expiry on create', async () => {
    const dto: any = {
      name: 'Дом',
      category: 'PRIVATE_HOUSE',
      latitude: 1,
      longitude: 2,
      userLatitude: 1,
      userLongitude: 2,
    };
    await service.createUserProperty(1, dto);
    expect(propertyRepository.create).toHaveBeenCalled();
    const args = (propertyRepository.create as any).mock.calls[0][0];
    expect(args.confirmationCode).toMatch(/^\d{6}$/);
    expect(new Date(args.confirmationCodeExpiresAt).getTime()).toBeGreaterThan(
      Date.now(),
    );
  });
});
