import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO для параметров запроса непрочитанных сообщений
 */
export class GetUnreadMessagesDto {
  @ApiPropertyOptional({ description: 'Номер страницы', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Количество элементов на странице', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ description: 'Фильтр по ID события' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  eventId?: number;
}


