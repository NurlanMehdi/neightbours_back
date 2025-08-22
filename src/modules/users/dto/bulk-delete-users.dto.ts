import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize, ArrayNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class BulkDeleteUsersDto {
  @ApiProperty({
    description: 'Массив ID пользователей для удаления',
    type: [Number],
    example: [1, 2, 3, 4, 5],
    isArray: true,
  })
  @IsArray({ message: 'IDs должны быть массивом' })
  @ArrayNotEmpty({ message: 'Массив ID не может быть пустым' })
  @ArrayMinSize(1, { message: 'Должен быть указан хотя бы один ID' })
  @Transform(({ value }) => value.map(Number))
  @IsInt({ each: true, message: 'Каждый ID должен быть числом' })
  ids: number[];
}
