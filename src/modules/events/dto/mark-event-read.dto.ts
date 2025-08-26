import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

export class MarkEventReadDto {
  @ApiProperty({
    description: 'ID события',
    example: 1,
  })
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  eventId: number;

  @ApiProperty({
    description: 'ID пользователя',
    example: 1,
  })
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  userId: number;
}
