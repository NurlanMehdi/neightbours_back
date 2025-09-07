import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetChatHistoryDto {
  @ApiProperty({
    description: 'Номер страницы',
    example: 1,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Номер страницы должен быть числом' })
  @Min(1, { message: 'Номер страницы не может быть меньше 1' })
  page?: number = 1;

  @ApiProperty({
    description: 'Количество сообщений на странице',
    example: 50,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Лимит должен быть числом' })
  @Min(1, { message: 'Лимит не может быть меньше 1' })
  @Max(100, { message: 'Лимит не может быть больше 100' })
  limit?: number = 50;
}
