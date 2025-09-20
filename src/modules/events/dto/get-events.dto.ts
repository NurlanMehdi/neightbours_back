import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { EventType } from '@prisma/client';
import { TransformToInt } from '../../../common/utils/form-data-transformers.util';

export class GetEventsDto {
  @ApiProperty({
    description: 'Тип события',
    enum: EventType,
    required: false,
  })
  @IsEnum(EventType)
  @IsOptional()
  type?: EventType;

  @ApiProperty({
    description: 'ID категории события',
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @TransformToInt()
  categoryId?: number;

  @ApiProperty({
    description: 'Номер страницы',
    required: false,
    default: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @TransformToInt()
  page?: number = 1;

  @ApiProperty({
    description: 'Количество элементов на странице',
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @TransformToInt()
  limit?: number;
}
