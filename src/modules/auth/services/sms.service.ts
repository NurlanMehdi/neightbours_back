import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

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
      this.logger.error('SMS service configuration is incomplete', {
        hasLogin: !!smsConfig?.login,
        hasPassword: !!smsConfig?.password,
        hasApiUrl: !!smsConfig?.apiUrl,
        hasSender: !!smsConfig?.sender,
      });
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
        timeout: 10000, 
        validateStatus: (status) => status < 500, 
      });

      this.logger.log(`SMS API response: ${JSON.stringify(response.data)}`);

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse response data
      let responseData = response.data;
      if (typeof responseData !== 'string') {
        responseData = JSON.stringify(responseData);
      }

      const [status, messageId] = responseData.split(';');

      if (status !== 'accepted') {
        throw new Error(`SMS API rejected request: ${status}`);
      }

      this.logger.log(`SMS отправлено успешно. Message ID: ${messageId}`);
      return messageId || 'sent';

    } catch (error) {
      let errorMessage = 'Unknown error occurred';
      let errorDetails = {};

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        errorMessage = `Network error: ${axiosError.code || axiosError.message}`;
        errorDetails = {
          code: axiosError.code,
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          responseData: axiosError.response?.data,
          url: axiosError.config?.url,
        };
      } else if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = {
          name: error.name,
          stack: error.stack,
        };
      } else {
        errorMessage = String(error);
      }

      this.logger.error(
        `Ошибка отправки SMS на номер ${phone}: ${errorMessage}`,
        {
          error: errorDetails,
          phone,
          code,
          apiUrl,
        }
      );

      throw new InternalServerErrorException(
        `Ошибка отправки SMS: ${errorMessage}`,
      );
    }
  }
}