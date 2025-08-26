import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

export class AddMessageDto {
  @ApiProperty({
    description: 'ID события',
    example: 1,
  })
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  eventId: number;

  @ApiProperty({
    description: 'ID пользователя',
    example: 2,
  })
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  userId: number;

  @ApiProperty({
    description: 'Текст сообщения',
    example: 'Test message for read status',
  })
  @IsString()
  @IsNotEmpty()
  text: string;
}
