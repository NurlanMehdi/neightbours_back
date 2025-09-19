import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ReplyMessageDto {
  @ApiProperty({ description: 'Текст ответа', example: 'Отвечаю на ваше сообщение' })
  @IsString()
  @MinLength(1)
  text: string;
}

