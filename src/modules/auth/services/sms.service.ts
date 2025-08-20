import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Сервис для отправки SMS сообщений.
 * В тестовом режиме только логирует сообщения.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Отправляет SMS сообщение.
   * В тестовом режиме только логирует сообщение.
   * @param phone Номер телефона получателя.
   * @param code Код подтверждения.
   */
  async sendSms(phone: string, code: string): Promise<string> {
    const smsConfig = this.configService.get('sms');
    
    if (!smsConfig || !smsConfig.login || !smsConfig.password || !smsConfig.apiUrl || !smsConfig.sender) {
      throw new InternalServerErrorException(
        'SMS service configuration is incomplete',
      );
    }

    const { login, password, apiUrl, sender } = smsConfig;
    const text = `Ваш код подтверждения: ${code}`;
    
    try {
      this.logger.log(`Отправка SMS на номер ${phone} с кодом ${code}`);
      const response = await axios.get(apiUrl, {
        params: {
          login,
          password,
          phone,
          text,
          sender,
        },
      });

      const [status, messageId] = response.data.split(';');

      if (status !== 'accepted') {
        throw new Error(`Ошибка отправки SMS: ${status}`);
      }

      return messageId;
    } catch (error) {
      this.logger.error(`Ошибка отправки SMS: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `Ошибка отправки SMS: ${error.message}`,
      );
    }
  }
}
