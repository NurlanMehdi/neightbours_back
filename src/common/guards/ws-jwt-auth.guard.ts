import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();

      // Пытаемся получить токен из разных источников
      let token = client.handshake.auth.token;

      if (!token) {
        // Если токен не в auth, пробуем из query параметров
        token = client.handshake.query.token as string;
      }

      if (!token) {
        throw new WsException('Токен не предоставлен');
      }

      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = this.jwtService.verify(token, { secret });
      client.data.user = payload;

      return true;
    } catch (error) {
      if (error instanceof WsException) {
        throw error;
      }
      throw new WsException('Недействительный токен');
    }
  }
}
