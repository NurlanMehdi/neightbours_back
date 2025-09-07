import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { Expose } from 'class-transformer';

export class RequestDeletionDto {
  @ApiProperty({
    description: 'Сообщение об успешной отправке кода',
    example: 'Код подтверждения отправлен на ваш номер телефона',
  })
  @Expose()
  message: string;

  @ApiProperty({
    description: 'Код подтверждения удаления',
    example: '1234',
  })
  @Expose()
  code: string;

  @ApiProperty({
    description: 'Дата истечения кода',
    example: '2024-01-20T10:35:00.000Z',
  })
  @Expose()
  date: Date;
}

export class ConfirmDeletionDto {
  @ApiProperty({
    description: 'Код подтверждения удаления',
    example: '1234',
    minLength: 4,
    maxLength: 6,
  })
  @IsString()
  @Length(4, 6)
  code: string;
}

export class ConfirmDeletionResponseDto {
  @ApiProperty({
    description: 'Сообщение о запланированном удалении',
    example:
      'Профиль будет удален через 14 дней. Вы можете отменить удаление до этого времени.',
  })
  @Expose()
  message: string;

  @ApiProperty({
    description: 'Дата запланированного удаления',
    example: '2024-01-20T10:30:00.000Z',
  })
  @Expose()
  deletionScheduledAt: Date;
}

export class RestoreProfileDto {
  @ApiProperty({
    description: 'Сообщение об успешном восстановлении',
    example: 'Профиль успешно восстановлен. Удаление отменено.',
  })
  @Expose()
  message: string;
}
