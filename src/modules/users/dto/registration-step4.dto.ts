import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsLatitude, IsLongitude } from 'class-validator';
import { Expose } from 'class-transformer';
import { TransformToFloat } from '../../../common/utils/form-data-transformers.util';

export class RegistrationStep4Dto {
  @ApiProperty({
    description: 'Код для вступления в сообщество',
    example: 'ABC123',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Expose()
  communityCode?: string;

  @ApiProperty({
    description: 'Название нового сообщества',
    example: 'Мой район',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Expose()
  communityName?: string;

  @ApiProperty({
    description: 'Широта местоположения пользователя',
    example: 55.7558,
    type: 'number',
  })
  @IsLatitude()
  @TransformToFloat()
  @Expose()
  userLatitude: number;

  @ApiProperty({
    description: 'Долгота местоположения пользователя',
    example: 37.6176,
    type: 'number',
  })
  @IsLongitude()
  @TransformToFloat()
  @Expose()
  userLongitude: number;

  @ApiProperty({
    description:
      'Широта местоположения сообщества (используется при создании нового сообщества)',
    example: 55.7558,
    type: 'number',
    required: false,
  })
  @IsLatitude()
  @IsOptional()
  @TransformToFloat()
  @Expose()
  communityLatitude?: number;

  @ApiProperty({
    description:
      'Долгота местоположения сообщества (используется при создании нового сообщества)',
    example: 37.6176,
    type: 'number',
    required: false,
  })
  @IsLongitude()
  @IsOptional()
  @TransformToFloat()
  @Expose()
  communityLongitude?: number;
}
