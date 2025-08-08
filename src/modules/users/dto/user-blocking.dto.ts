import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDate, IsNumber, IsString } from 'class-validator';
import { BlockingStatus } from '@prisma/client';
import { UserDto } from './user.dto';

export class UserBlockingDto {
  @ApiProperty()
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty()
  @Expose()
  @IsString()
  userPhone: string;

  @ApiProperty()
  @Expose()
  @IsString()
  userId: string;

  @ApiProperty()
  @Expose()
  @IsString()
  reason: string;

  @ApiProperty()
  @Expose()
  status: BlockingStatus;

  @ApiProperty()
  @Expose()
  @IsDate()
  blockedAt: Date;

  @ApiProperty({
    description: 'Информация о пользователе',
    type: UserDto,
  })
  @Expose()
  user: UserDto;
}
