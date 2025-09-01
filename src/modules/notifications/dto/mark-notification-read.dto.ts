import { IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO для отметки уведомления как прочитанного
 */
export class MarkNotificationReadDto {
  @ApiProperty({
    description: 'ID уведомления',
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'ID уведомления должен быть целым числом' })
  @IsPositive({ message: 'ID уведомления должен быть положительным числом' })
  notificationId: number;
}
