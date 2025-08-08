import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { TransformToBoolean, TransformToInt } from '../../../common/utils/form-data-transformers.util';

export class UpdateGeoModerationSettingsDto {
  @ApiProperty({
    description: 'Включить гео-модерацию вступления в сообщество',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean({ message: 'Значение должно быть булевым' })
  @TransformToBoolean()
  communityJoinEnabled?: boolean;

  @ApiProperty({
    description: 'Максимальное расстояние для вступления в сообщество (в метрах)',
    example: 500,
    required: false,
    minimum: 10,
    maximum: 10000
  })
  @IsOptional()
  @IsNumber({}, { message: 'Расстояние должно быть числом' })
  @Min(10, { message: 'Минимальное расстояние 10 метров' })
  @Max(10000, { message: 'Максимальное расстояние 10000 метров' })
  @TransformToInt()
  communityJoinMaxDistance?: number;

  @ApiProperty({
    description: 'Включить гео-модерацию подтверждения объекта',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean({ message: 'Значение должно быть булевым' })
  @TransformToBoolean()
  propertyVerificationEnabled?: boolean;

  @ApiProperty({
    description: 'Максимальное расстояние для подтверждения объекта (в метрах)',
    example: 100,
    required: false,
    minimum: 10,
    maximum: 1000
  })
  @IsOptional()
  @IsNumber({}, { message: 'Расстояние должно быть числом' })
  @Min(10, { message: 'Минимальное расстояние 10 метров' })
  @Max(100000, { message: 'Максимальное расстояние 100000 метров' })
  @TransformToInt()
  propertyVerificationMaxDistance?: number;

  @ApiProperty({
    description: 'Включить гео-модерацию добавления объекта',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean({ message: 'Значение должно быть булевым' })
  @TransformToBoolean()
  propertyCreationEnabled?: boolean;

  @ApiProperty({
    description: 'Максимальное расстояние для добавления объекта (в метрах)',
    example: 100,
    required: false,
    minimum: 10,
    maximum: 1000
  })
  @IsOptional()
  @IsNumber({}, { message: 'Расстояние должно быть числом' })
  @Min(10, { message: 'Минимальное расстояние 10 метров' })
  @Max(100000, { message: 'Максимальное расстояние 100000 метров' })
  @TransformToInt()
  propertyCreationMaxDistance?: number;
}
