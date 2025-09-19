import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class SearchMessagesDto {
  @ApiProperty({ description: 'Строка поиска', example: 'привет' })
  @IsString()
  @MinLength(1)
  q: string;

  @ApiPropertyOptional({ description: 'Страница', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Лимит', example: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 50;
}
