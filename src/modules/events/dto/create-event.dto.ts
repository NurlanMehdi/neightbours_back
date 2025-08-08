import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { TransformToFloat, TransformToInt, TransformToBoolean, TransformVotingOptions } from '../../../common/utils/form-data-transformers.util';

/**
 * DTO для варианта голосования
 */
export class CreateVotingOptionDto {
  @ApiProperty({
    description: 'Текст варианта ответа',
    example: 'Да',
  })
  @IsString()
  text: string;
}

/**
 * DTO для создания мероприятия
 */
export class CreateEventDto {
  @ApiProperty({ description: 'Название мероприятия' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Описание мероприятия' })
  @IsString()
  @IsOptional()
  description?: string;

  // Поле image обрабатывается отдельно через @UploadedFile() в контроллере
  // и не должно быть в DTO

  @ApiProperty({ description: 'Широта' })
  @IsNumber()
  @TransformToFloat()
  latitude: number;

  @ApiProperty({ description: 'Долгота' })
  @IsNumber()
  @TransformToFloat()
  longitude: number;

  @ApiProperty({ description: 'ID категории мероприятия' })
  @IsNumber()
  @TransformToInt()
  categoryId: number;

  @ApiProperty({ description: 'Тип мероприятия', enum: ['EVENT', 'NOTIFICATION'] })
  @IsString()
  type: string;

  @ApiPropertyOptional({ description: 'Нужно ли голосование', default: false })
  @IsBoolean()
  @IsOptional()
  @TransformToBoolean()
  hasVoting?: boolean = false;

  @ApiPropertyOptional({ description: 'Вопрос для голосования', required: false })
  @IsString()
  @IsOptional()
  votingQuestion?: string;

  @ApiPropertyOptional({ description: 'Нужен ли сбор денег', default: false })
  @IsBoolean()
  @IsOptional()
  @TransformToBoolean()
  hasMoneyCollection?: boolean = false;

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

  @ApiProperty({ description: 'ID сообщества' })
  @IsNumber()
  @TransformToInt()
  communityId: number;

  @ApiPropertyOptional({
    description: 'Варианты ответов для голосования (можно передавать как строки через запятую или объекты)',
    type: 'string',
    required: false,
    example: 'Да,Нет,Возможно',
  })
  @IsOptional()
  @IsString()
  votingOptions?: any;
}
