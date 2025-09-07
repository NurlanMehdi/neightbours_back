import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    description: 'Сообщение пользователя для AI ассистента',
    example: 'Привет! Как дела?',
  })
  @IsNotEmpty({ message: 'Сообщение не может быть пустым' })
  @IsString({ message: 'Сообщение должно быть строкой' })
  message: string;

  @ApiProperty({
    description: 'Температура генерации (креативность ответа)',
    example: 0.7,
    required: false,
    minimum: 0,
    maximum: 2,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Температура должна быть числом' })
  @Min(0, { message: 'Температура не может быть меньше 0' })
  @Max(2, { message: 'Температура не может быть больше 2' })
  temperature?: number;

  @ApiProperty({
    description: 'Максимальная длина ответа в токенах',
    example: 1000,
    required: false,
    minimum: 1,
    maximum: 4000,
  })
  @IsOptional()
  @IsNumber(
    {},
    { message: 'Максимальное количество токенов должно быть числом' },
  )
  @Min(1, { message: 'Максимальное количество токенов не может быть меньше 1' })
  @Max(4000, {
    message: 'Максимальное количество токенов не может быть больше 4000',
  })
  maxTokens?: number;
}
