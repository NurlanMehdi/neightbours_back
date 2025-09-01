import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO для количества непрочитанных уведомлений
 */
export class UnreadCountDto {
  @ApiProperty({
    description: 'Количество непрочитанных уведомлений',
    example: 5,
  })
  @Expose()
  count: number;
}
