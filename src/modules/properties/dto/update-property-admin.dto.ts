import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsLatitude, IsLongitude, IsOptional, IsString, MaxLength } from 'class-validator';
import { PropertyCategory, PropertyVerificationStatus } from '@prisma/client';
import { TransformToFloat, TransformToInt } from '../../../common/utils/form-data-transformers.util';

export class UpdatePropertyAdminDto {
  @ApiProperty({
    description: 'Название объекта недвижимости',
    example: 'Дом на улице Ленина',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: 'Категория объекта недвижимости',
    enum: PropertyCategory,
    example: PropertyCategory.PRIVATE_HOUSE,
    required: false,
  })
  @IsOptional()
  @IsEnum(PropertyCategory)
  category?: PropertyCategory;

  @ApiProperty({
    description: 'Широта',
    example: 55.7558,
    required: false,
  })
  @IsOptional()
  @IsLatitude()
  @TransformToFloat()
  latitude?: number;

  @ApiProperty({
    description: 'Долгота',
    example: 37.6176,
    required: false,
  })
  @IsOptional()
  @IsLongitude()
  @TransformToFloat()
  longitude?: number;

  @ApiProperty({
    description: 'Статус верификации объекта',
    enum: PropertyVerificationStatus,
    example: PropertyVerificationStatus.VERIFIED,
    required: false,
  })
  @IsOptional()
  @IsEnum(PropertyVerificationStatus)
  verificationStatus?: PropertyVerificationStatus;

  @ApiProperty({
    description: 'ID пользователя-владельца',
    example: 1,
    required: false,
  })
  @IsOptional()
  @TransformToInt()
  userId?: number;
} 