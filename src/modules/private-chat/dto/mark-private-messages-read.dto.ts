import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

export class MarkPrivateMessagesReadDto {
  @ApiProperty({
    description: 'ID диалога',
    example: 1,
  })
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  chatId: number;

  @ApiProperty({
    description: 'ID пользователя',
    example: 1,
  })
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  userId: number;
}

