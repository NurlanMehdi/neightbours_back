import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ConfirmPropertyDto {
  @ApiProperty({ description: 'Код подтверждения', example: '123456' })
  @IsString()
  @Length(4, 12)
  code: string;
}

