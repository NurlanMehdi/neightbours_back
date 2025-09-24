import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class ConfirmPropertyDto {
  @ApiProperty({ description: 'Код подтверждения', example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/)
  code: string;
}
