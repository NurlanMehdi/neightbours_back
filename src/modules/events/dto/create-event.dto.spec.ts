import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateEventDto } from './create-event.dto';

describe('CreateEventDto', () => {
  it('should validate successfully with all required fields', async () => {
    const dto = plainToClass(CreateEventDto, {
      title: 'Test Event',
      latitude: '55.7558',
      longitude: '37.6176',
      categoryId: '1',
      type: 'EVENT',
      communityId: '1',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate successfully with optional fields', async () => {
    const dto = plainToClass(CreateEventDto, {
      title: 'Test Event',
      latitude: '55.7558',
      longitude: '37.6176',
      categoryId: '1',
      type: 'EVENT',
      communityId: '1',
      maxParticipants: '50',
      isPublic: 'true',
      description: 'Test description',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept extra fields when forbidNonWhitelisted is false', async () => {
    const dto = plainToClass(CreateEventDto, {
      title: 'Test Event',
      latitude: '55.7558',
      longitude: '37.6176',
      categoryId: '1',
      type: 'EVENT',
      communityId: '1',
      location: { lat: 55.7558, lng: 37.6176 }, // Extra field
      extraField: 'should be ignored',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should transform string numbers to actual numbers', async () => {
    const dto = plainToClass(CreateEventDto, {
      title: 'Test Event',
      latitude: '55.7558',
      longitude: '37.6176',
      categoryId: '1',
      type: 'EVENT',
      communityId: '1',
      maxParticipants: '50',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.maxParticipants).toBe(50);
    expect(dto.latitude).toBe(55.7558);
    expect(dto.longitude).toBe(37.6176);
    expect(dto.categoryId).toBe(1);
    expect(dto.communityId).toBe(1);
  });

  it('should transform string booleans to actual booleans', async () => {
    const dto = plainToClass(CreateEventDto, {
      title: 'Test Event',
      latitude: '55.7558',
      longitude: '37.6176',
      categoryId: '1',
      type: 'EVENT',
      communityId: '1',
      isPublic: 'true',
      hasVoting: 'false',
      hasMoneyCollection: 'true',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.isPublic).toBe(true);
    expect(dto.hasVoting).toBe(false);
    expect(dto.hasMoneyCollection).toBe(true);
  });
});
