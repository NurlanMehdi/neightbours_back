import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SearchMessagesDto {
  @ApiProperty({ description: 'Поисковый запрос', example: 'привет' })
  @IsString()
  @IsNotEmpty()
  query: string;
}
