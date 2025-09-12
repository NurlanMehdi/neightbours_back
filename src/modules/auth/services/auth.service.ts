import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SmsService } from './sms.service';
import { WebSocketSessionService } from './websocket-session.service';
import {
  InvalidSmsCodeException,
  SmsCodeExpiredException,
} from '../../../common/exceptions/auth.exception';
import { UserRepository } from '../../users/repositories/user.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'crypto';

interface TokenPayload {
  sub: number;
  phone?: string;
  role?: string;
  type: 'access' | 'refresh';
}

/**
 * Сервис для аутентификации пользователей.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly smsService: SmsService,
    private readonly webSocketSessionService: WebSocketSessionService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Отправляет SMS с кодом подтверждения.
   * @param phone Номер телефона (строка из 11 цифр).
   * @returns Сообщение об успешной отправке.
   */
  async sendSms(phone: string) {
    this.logger.log(`Отправка SMS на номер ${phone}`);
    const code = randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const user = await this.userRepository.findByPhone(phone);

    if (user) {
      await this.userRepository.updateSmsCode(Number(user.id), code, expiresAt);
    } else {
      await this.userRepository.createUser({
        phone: phone,
        smsCode: code,
        smsCodeExpiresAt: expiresAt,
      });
    }

    // const isDevelopment = this.configService.get('NODE_ENV') === 'development';
    //
    // if (!isDevelopment) {
    //   await this.smsService.sendSms(phone, code);
    //   return { message: 'SMS отправлено' };
    // }

    return {
      message: 'Режим разработки: SMS не отправлено',
      code,
      expiresAt,
    };
  }

  /**
   * Проверяет SMS код и выдает токены
   */
  async verifySms(phone: string, code: string) {
    this.logger.log(`Проверка SMS кода для номера ${phone}`);
    const user = await this.userRepository.findByPhone(phone);

    if (!user || user.smsCode !== code) {
      throw new InvalidSmsCodeException();
    }
    if (!user.smsCodeExpiresAt) {
      throw new SmsCodeExpiredException();
    }
    if (user.smsCodeExpiresAt < new Date()) {
      throw new SmsCodeExpiredException();
    }

    await this.userRepository.verifyUser(Number(user.id));

    return this.generateTokens({
      sub: user.id,
      phone: user.phone.toString(),
    });
  }

  /**
   * Проверяет логин и пароль, выдает токены
   */
  async adminLogin(login: string, password: string) {
    const user = await this.validateAdminUser(login, password);
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.generateTokens({
      sub: user.id,
      role: user.role,
      phone: user.phone == null ? null : user.phone.toString(),
    });
  }

  /**
   * Обновляет токены
   */
  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<TokenPayload>(refreshToken);

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Неверный тип токена');
      }

      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Пользователь не найден');
      }

      return this.generateTokens({
        sub: user.id,
        role: user.role,
        phone: user.phone?.toString(),
      });
    } catch (error) {
      throw new UnauthorizedException('Недействительный refresh токен');
    }
  }

  /**
   * Авторизация по логину и паролю
   */
  async validateAdminUser(login: string, password: string) {
    const user = await this.userRepository.findByLogin(login);
    if (user && (await bcrypt.compare(password, user.password))) {
      await this.userRepository.update(Number(user.id), {
        lastAccess: new Date(),
      });
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  /**
   * Выход из системы - очищает FCM токен пользователя и WebSocket сессии
   */
  async logout(userId: number) {
    this.logger.log(`Выход пользователя ${userId} из системы`);

    // Очищаем FCM токен
    const user = await this.userRepository.findById(userId);
    if (user && (user as any).fcmToken) {
      await this.userRepository.update(userId, {
        fcmToken: null,
      });
      this.logger.log(`FCM токен пользователя ${userId} очищен при выходе`);
    }

    // Отключаем все WebSocket сессии пользователя
    await this.webSocketSessionService.disconnectUserSessions(userId);
    
    this.logger.log(`Выход пользователя ${userId} завершен`);

    return { message: 'Успешный выход из системы' };
  }

  /**
   * Генерирует пару токенов (access и refresh)
   */
  private generateTokens(payload: Omit<TokenPayload, 'type'>) {
    const accessToken = this.jwtService.sign(
      { ...payload, type: 'access' },
      { expiresIn: '12h' },
    );

    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      { expiresIn: '24h' },
    );

    return { accessToken, refreshToken };
  }
}
