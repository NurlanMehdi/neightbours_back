import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({
    description: 'Текст сообщения',
    example: 'Привет всем!',
  })
  @IsString()
  @IsNotEmpty()
  text: string;
}
