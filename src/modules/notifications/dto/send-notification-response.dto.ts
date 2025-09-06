import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * DTO для ответа при отправке уведомлений
 */
export class SendNotificationResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Статус операции',
    example: true,
  })
  success: boolean;

  @Expose()
  @ApiProperty({
    description: 'Сообщение о результате операции',
    example: 'Уведомления успешно отправлены 3 пользователям',
  })
  message: string;

  @Expose()
  @ApiProperty({
    description: 'Количество отправленных уведомлений',
    example: 3,
  })
  count: number;
}
