import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransformToFloat, TransformToInt, TransformToBoolean } from '../../../common/utils/form-data-transformers.util';

export enum CommunitySortBy {
  ID = 'id',
  NAME = 'name',
  NUMBER_OF_USERS = 'numberOfUsers',
  CREATED_AT = 'createdAt',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum CommunitySize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

export class GetCommunitiesAdminDto {
  @ApiProperty({
    description: 'Номер страницы (не используется если withoutPagination=true)',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @TransformToInt()
  page?: number = 1;

  @ApiProperty({
    description:
      'Количество записей на странице (не используется если withoutPagination=true)',
    example: 10,
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @TransformToInt()
  limit?: number = 10;

  @ApiProperty({
    description: 'Получить все записи без пагинации',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @TransformToBoolean()
  withoutPagination?: boolean = false;

  @ApiProperty({
    description: 'Поле для сортировки',
    enum: CommunitySortBy,
    example: CommunitySortBy.CREATED_AT,
    required: false,
  })
  @IsOptional()
  @IsEnum(CommunitySortBy)
  sortBy?: CommunitySortBy = CommunitySortBy.CREATED_AT;

  @ApiProperty({
    description: 'Порядок сортировки',
    enum: SortOrder,
    example: SortOrder.DESC,
    required: false,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiProperty({
    description: 'Поиск по названию сообщества (без учета регистра)',
    example: 'Солнечный',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description:
      'Начальная дата периода создания (включительно). Формат: YYYY-MM-DD',
    example: '2023-01-01',
    required: false,
  })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiProperty({
    description:
      'Конечная дата периода создания (включительно). Формат: YYYY-MM-DD',
    example: '2023-01-31',
    required: false,
  })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiProperty({
    description: 'Минимальное количество участников (включительно)',
    example: 20,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @TransformToInt()
  minParticipants?: number;

  @ApiProperty({
    description: 'Максимальное количество участников (включительно)',
    example: 100,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @TransformToInt()
  maxParticipants?: number;

  @ApiProperty({
    description:
      'Фильтр по размеру сообщества: small (до 20), medium (20-100), large (100+)',
    enum: CommunitySize,
    example: CommunitySize.SMALL,
    required: false,
  })
  @IsOptional()
  @IsEnum(CommunitySize)
  size?: CommunitySize;

  @ApiProperty({
    description: 'Широта центра для фильтрации по радиусу',
    example: 55.7558,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  @TransformToFloat()
  latitude?: number;

  @ApiProperty({
    description: 'Долгота центра для фильтрации по радиусу',
    example: 37.6176,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  @TransformToFloat()
  longitude?: number;

  @ApiProperty({
    description:
      'Радиус поиска в километрах (используется вместе с latitude и longitude)',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000)
  @TransformToFloat()
  radius?: number;
}
