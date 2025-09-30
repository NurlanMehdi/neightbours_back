import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO для поискового запроса сообщений
 */
export class SearchMessagesQueryDto {
  @ApiProperty({
    description: 'Поисковый запрос',
    example: 'hello world',
    required: true,
  })
  @IsNotEmpty({ message: 'Поисковый запрос не может быть пустым' })
  @IsString({ message: 'Поисковый запрос должен быть строкой' })
  q: string;
}

