import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { BaseUserDto } from './base.dto';

describe('BaseUserDto', () => {
  it('should validate successfully with optional fields', async () => {
    const dto = plainToClass(BaseUserDto, {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      address: '123 Main Street',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept extra fields when forbidNonWhitelisted is false', async () => {
    const dto = plainToClass(BaseUserDto, {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      address: '123 Main Street',
      extraField: 'should be ignored',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate email format', async () => {
    const dto = plainToClass(BaseUserDto, {
      email: 'invalid-email',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('email');
  });

  it('should validate phone as string', async () => {
    const dto = plainToClass(BaseUserDto, {
      phone: '+1234567890',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.phone).toBe('+1234567890');
  });

  it('should validate address as string', async () => {
    const dto = plainToClass(BaseUserDto, {
      address: '123 Main Street',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.address).toBe('123 Main Street');
  });

  it('should validate gender enum', async () => {
    const dto = plainToClass(BaseUserDto, {
      gender: 'MALE',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.gender).toBe('MALE');
  });

  it('should reject invalid gender', async () => {
    const dto = plainToClass(BaseUserDto, {
      gender: 'INVALID_GENDER',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('gender');
  });
});
