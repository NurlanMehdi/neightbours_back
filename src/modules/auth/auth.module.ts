import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { SmsService } from './services/sms.service';
import { WebSocketSessionService } from './services/websocket-session.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    forwardRef(() => NotificationsModule),
    forwardRef(() => EventsModule),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: '12h', // Время жизни access токена
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SmsService, WebSocketSessionService, JwtStrategy],
  exports: [AuthService, WebSocketSessionService],
})
export class AuthModule {}
