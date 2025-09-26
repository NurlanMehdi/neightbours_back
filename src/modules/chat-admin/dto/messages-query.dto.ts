import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export enum AdminChatType {
  COMMUNITY = 'COMMUNITY',
  EVENT = 'EVENT',
}

export class MessagesQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiProperty({ enum: AdminChatType, description: 'Тип чата (обязательный)' })
  @IsEnum(AdminChatType)
  chatType!: AdminChatType;

  @ApiProperty({ description: 'ID чата (communityId или eventId) (обязательный)' })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  chatId!: number;

  @ApiPropertyOptional({ description: 'Фильтр по ID пользователя-автора' })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional({ description: 'Поиск по тексту сообщения (ILIKE)' })
  @IsOptional()
  @IsString()
  q?: string;
}

