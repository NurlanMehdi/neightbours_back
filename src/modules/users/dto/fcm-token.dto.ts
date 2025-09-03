import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO для обновления FCM токена
 */
export class UpdateFcmTokenDto {
  @ApiProperty({
    description: 'FCM токен устройства для push-уведомлений',
    example: 'dQw4w9WgXcQ:APA91bHun4QrN...',
  })
  @IsString({ message: 'FCM токен должен быть строкой' })
  @IsNotEmpty({ message: 'FCM токен не может быть пустым' })
  fcmToken: string;

  @ApiProperty({
    description: 'Включить push-уведомления для пользователя',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Настройка push-уведомлений должна быть булевым значением' })
  pushNotificationsEnabled?: boolean;
}

/**
 * DTO для настроек push-уведомлений
 */
export class PushNotificationSettingsDto {
  @ApiProperty({
    description: 'Включить push-уведомления',
    example: true,
  })
  @IsBoolean({ message: 'Настройка push-уведомлений должна быть булевым значением' })
  pushNotificationsEnabled: boolean;
}

/**
 * DTO ответа после обновления настроек
 */
export class FcmTokenResponseDto {
  @ApiProperty({
    description: 'Сообщение об успешном обновлении',
    example: 'FCM токен успешно обновлен',
  })
  message: string;

  @ApiProperty({
    description: 'Статус push-уведомлений',
    example: true,
  })
  pushNotificationsEnabled: boolean;
}
