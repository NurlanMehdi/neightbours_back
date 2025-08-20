import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SmsCodeExpiredException } from '../../../common/exceptions/auth.exception';

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
    const login = this.configService.get<string>('SMS_LOGIN');
    const password = this.configService.get<string>('SMS_PASSWORD');
    const apiUrl = this.configService.get<string>('SMS_API_URL');
    const sender = this.configService.get<string>('SMS_SENDER');

    if (!login || !password || !apiUrl || !sender) {
      throw new InternalServerErrorException(
        'SMS service configuration is incomplete',
      );
    }

    const text = `Ваш код подтверждения: ${code}`;
    if (!apiUrl) {
      throw new SmsCodeExpiredException();
    }
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
      throw new InternalServerErrorException(
        `Ошибка отправки SMS: ${error.message}`,
      );
    }
  }
}
