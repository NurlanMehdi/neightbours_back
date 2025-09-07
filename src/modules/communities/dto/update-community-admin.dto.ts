import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsLatitude,
  IsLongitude,
  IsEnum,
} from 'class-validator';
import { CommunityStatus } from '@prisma/client';
import { TransformToFloat } from '../../../common/utils/form-data-transformers.util';

export class UpdateCommunityAdminDto {
  @ApiProperty({
    description: 'Название сообщества',
    example: 'ЖК "Солнечный"',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Описание сообщества',
    example: 'Сообщество жителей ЖК "Солнечный"',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Широта местоположения',
    example: 55.7558,
    required: false,
  })
  @IsLatitude()
  @IsOptional()
  @TransformToFloat()
  latitude?: number;

  @ApiProperty({
    description: 'Долгота местоположения',
    example: 37.6173,
    required: false,
  })
  @IsLongitude()
  @IsOptional()
  @TransformToFloat()
  longitude?: number;

  @ApiProperty({
    description: 'Статус сообщества',
    enum: CommunityStatus,
    example: CommunityStatus.ACTIVE,
    required: false,
  })
  @IsEnum(CommunityStatus)
  @IsOptional()
  status?: CommunityStatus;
}
