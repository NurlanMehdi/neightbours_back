import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateVotingOptionDto } from './create-event.dto';
import {
  TransformToFloat,
  TransformToInt,
  TransformToBoolean,
  TransformVotingOptions,
} from '../../../common/utils/form-data-transformers.util';

export class UpdateEventDto {
  @ApiPropertyOptional({ description: 'Название мероприятия' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Описание мероприятия' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Картинка мероприятия',
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  image?: any;

  @ApiPropertyOptional({ description: 'Широта' })
  @IsNumber()
  @IsOptional()
  @TransformToFloat()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Долгота' })
  @IsNumber()
  @IsOptional()
  @TransformToFloat()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'ID категории мероприятия',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @TransformToInt()
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Тип мероприятия',
    enum: ['EVENT', 'NOTIFICATION'],
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: 'Нужно ли голосование', default: false })
  @IsBoolean()
  @IsOptional()
  @TransformToBoolean()
  hasVoting?: boolean;

  @ApiPropertyOptional({
    description: 'Вопрос для голосования',
    required: false,
  })
  @IsString()
  @IsOptional()
  votingQuestion?: string;

  @ApiPropertyOptional({ description: 'Нужен ли сбор денег', default: false })
  @IsBoolean()
  @IsOptional()
  @TransformToBoolean()
  hasMoneyCollection?: boolean;

  @ApiPropertyOptional({ description: 'Сумма сбора', required: false })
  @IsNumber()
  @IsOptional()
  @TransformToFloat()
  moneyAmount?: number;

  @ApiPropertyOptional({
    description: 'Дата и время проведения мероприятия',
    required: false,
    example: '2025-08-01T18:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  eventDateTime?: Date;

  @ApiPropertyOptional({ description: 'ID сообщества' })
  @IsNumber()
  @IsOptional()
  @TransformToInt()
  communityId?: number;

  @ApiPropertyOptional({
    description:
      'Варианты ответов для голосования (можно передавать как строки через запятую или объекты)',
    type: 'string',
    required: false,
    example: 'Да,Нет,Возможно',
  })
  @IsOptional()
  @IsString()
  votingOptions?: any;
}
