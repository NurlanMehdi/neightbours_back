import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

export class MarkCommunityMessagesReadDto {
  @ApiProperty({
    description: 'ID сообщества',
    example: 1,
  })
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  communityId: number;

  @ApiProperty({
    description: 'ID пользователя',
    example: 1,
  })
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  userId: number;
}

