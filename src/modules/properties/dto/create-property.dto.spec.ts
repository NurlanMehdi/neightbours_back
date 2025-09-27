import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreatePropertyDto } from './create-property.dto';

describe('CreatePropertyDto', () => {
  it('should validate successfully with all required fields', async () => {
    const dto = plainToClass(CreatePropertyDto, {
      name: 'Test Property',
      category: 'PRIVATE_HOUSE',
      latitude: '55.7558',
      longitude: '37.6176',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate successfully with optional userLatitude and userLongitude', async () => {
    const dto = plainToClass(CreatePropertyDto, {
      name: 'Test Property',
      category: 'PRIVATE_HOUSE',
      latitude: '55.7558',
      longitude: '37.6176',
      userLatitude: '55.7560',
      userLongitude: '37.6180',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept extra fields when forbidNonWhitelisted is false', async () => {
    const dto = plainToClass(CreatePropertyDto, {
      name: 'Test Property',
      category: 'PRIVATE_HOUSE',
      latitude: '55.7558',
      longitude: '37.6176',
      extraField: 'should be ignored',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should transform string numbers to actual numbers', async () => {
    const dto = plainToClass(CreatePropertyDto, {
      name: 'Test Property',
      category: 'PRIVATE_HOUSE',
      latitude: '55.7558',
      longitude: '37.6176',
      userLatitude: '55.7560',
      userLongitude: '37.6180',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.latitude).toBe(55.7558);
    expect(dto.longitude).toBe(37.6176);
    expect(dto.userLatitude).toBe(55.7560);
    expect(dto.userLongitude).toBe(37.6180);
  });

  it('should reject invalid latitude format', async () => {
    const dto = plainToClass(CreatePropertyDto, {
      name: 'Test Property',
      category: 'PRIVATE_HOUSE',
      latitude: 'invalid-latitude',
      longitude: '37.6176',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('latitude');
  });

  it('should reject invalid userLatitude format', async () => {
    const dto = plainToClass(CreatePropertyDto, {
      name: 'Test Property',
      category: 'PRIVATE_HOUSE',
      latitude: '55.7558',
      longitude: '37.6176',
      userLatitude: 'invalid-latitude',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('userLatitude');
  });
});
