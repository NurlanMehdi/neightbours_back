import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class DeleteResponseDto {
  @ApiProperty({
    description: 'Статус успешности операции',
    example: true,
  })
  @Expose()
  success: boolean;

  @ApiProperty({
    description: 'Сообщение о результате операции',
    example: 'Пользователи успешно удалены',
  })
  @Expose()
  message: string;

  @ApiProperty({
    description: 'Количество удаленных записей (только для bulk операций)',
    example: 5,
    required: false,
  })
  @Expose()
  deletedCount?: number;
}
