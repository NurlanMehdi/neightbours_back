import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO для сгруппированных MESSAGE_RECEIVED уведомлений
 */
export class GroupedMessageNotificationDto {
  @ApiProperty({
    description: 'Тип сгруппированного уведомления',
    example: 'MESSAGE_RECEIVED_GROUPED',
  })
  @Expose()
  type: 'MESSAGE_RECEIVED_GROUPED';

  @ApiProperty({
    description: 'Заголовок группы уведомлений',
    example: 'Новые сообщения',
  })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Количество сгруппированных уведомлений',
    example: 2,
  })
  @Expose()
  count: number;
}