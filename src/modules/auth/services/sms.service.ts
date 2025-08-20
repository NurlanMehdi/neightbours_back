import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendSms(phone: string, code: string): Promise<string> {
    const login = this.configService.get<string>('SMS_LOGIN');
    const password = this.configService.get<string>('SMS_PASSWORD');
    const apiUrl = this.configService.get<string>('SMS_API_URL');
    const sender = this.configService.get<string>('SMS_SENDER');

    if (!login || !password || !apiUrl || !sender) {
      throw new InternalServerErrorException('SMS service configuration is incomplete');
    }

    const text = `Ваш код подтверждения: ${code}`;

    try {
      this.logger.log(`Отправка SMS на номер ${phone} с кодом ${code}`);

      const params = new URLSearchParams();
      params.append('login', login);
      params.append('password', password);
      params.append('sender', sender);
      params.append('phones', phone); 
      params.append('text', text);

      const response = await axios.post(apiUrl, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const data: string = response.data;
      this.logger.debug(`SMS API response: ${data}`);
      
      const [status, messageId] = data.split(';');
      
      if (status !== 'accepted') {
        throw new Error(`Ошибка отправки SMS: ${status}`);
      }
      
      return messageId || 'accepted';
      
    } catch (error) {
      this.logger.error(
        `Ошибка при отправке SMS: ${error.response?.data?.description || error.message}`,
      );
      throw new InternalServerErrorException(
        `Ошибка отправки SMS: ${error.response?.data?.description || error.message}`,
      );
    }
  }
}
