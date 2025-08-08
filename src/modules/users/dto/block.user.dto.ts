import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class BlockUserDto {
  @ApiProperty({ description: 'Причина блокировки', required: true })
  @IsString()
  reason: string;
}
