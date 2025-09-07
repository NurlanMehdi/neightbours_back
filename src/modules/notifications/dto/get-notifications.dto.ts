import {
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../interfaces/notification.interface';

/**
 * DTO для получения списка уведомлений пользователя
 */
export class GetNotificationsDto {
  @ApiProperty({
    description: 'Номер страницы',
    example: 1,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Номер страницы должен быть целым числом' })
  @Min(1, { message: 'Номер страницы должен быть больше 0' })
  page?: number = 1;

  @ApiProperty({
    description: 'Количество записей на странице',
    example: 10,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Лимит должен быть целым числом' })
  @Min(1, { message: 'Лимит должен быть больше 0' })
  @Max(100, { message: 'Лимит не может быть больше 100' })
  limit?: number = 10;

  @ApiProperty({
    description: 'Фильтр по статусу прочтения',
    example: false,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'Статус прочтения должен быть булевым значением' })
  isRead?: boolean;

  @ApiProperty({
    description: 'Фильтр по типу уведомления',
    enum: NotificationType,
    required: false,
  })
  @IsOptional()
  @IsEnum(NotificationType, { message: 'Некорректный тип уведомления' })
  type?: NotificationType;

  @ApiProperty({
    description: 'Дата начала периода (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Некорректный формат даты начала' })
  dateFrom?: string;

  @ApiProperty({
    description: 'Дата окончания периода (ISO 8601)',
    example: '2024-12-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Некорректный формат даты окончания' })
  dateTo?: string;

  @ApiProperty({
    description: 'Фильтр по содержимому payload (JSON объект для поиска)',
    example: { eventId: 123 },
    required: false,
    type: Object,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsObject({ message: 'Payload должен быть объектом' })
  payload?: Record<string, any>;
}
