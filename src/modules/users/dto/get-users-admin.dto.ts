import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  TransformToInt,
  TransformToBoolean,
} from '../../../common/utils/form-data-transformers.util';

export enum UserSortBy {
  ID = 'id',
  NAME = 'name',
  PHONE = 'phone',
  CREATED_AT = 'createdAt',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class GetUsersAdminDto {
  @ApiProperty({
    description: 'Номер страницы',
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
    description: 'Количество записей на странице',
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
    description: 'Поле для сортировки',
    enum: UserSortBy,
    example: UserSortBy.NAME,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserSortBy)
  sortBy?: UserSortBy = UserSortBy.CREATED_AT;

  @ApiProperty({
    description: 'Порядок сортировки',
    enum: SortOrder,
    example: SortOrder.ASC,
    required: false,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiProperty({
    description:
      'Текстовый поиск по полям firstName, lastName, phone, email (без учета регистра)',
    example: 'Иванов',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description:
      'Начальная дата периода регистрации (включительно). Формат: YYYY-MM-DD',
    example: '2023-02-01',
    required: false,
  })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiProperty({
    description:
      'Конечная дата периода регистрации (включительно). Формат: YYYY-MM-DD',
    example: '2023-02-28',
    required: false,
  })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiProperty({
    description:
      'ID сообщества, в котором состоит пользователь. Специальное значение "none" для пользователей без сообщества',
    example: '123',
    required: false,
  })
  @IsOptional()
  @IsString()
  communityId?: string;

  @ApiProperty({
    description:
      'Статус верификации. true — только верифицированные, false — только неверифицированные',
    example: true,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  @TransformToBoolean()
  isVerified?: boolean;
}
