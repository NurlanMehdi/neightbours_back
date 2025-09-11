import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { SendSmsDto, VerifySmsDto } from '../dto/auth.dto';
import { AdminLoginDto } from '../dto/admin.login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UserId } from '../../../common/decorators/user-id.decorator';

@ApiTags('Аутентификация')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-sms')
  @ApiOperation({ summary: 'Отправка SMS с кодом подтверждения' })
  @ApiResponse({
    status: 200,
    description: 'SMS успешно отправлено',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный формат номера телефона',
  })
  async sendSms(@Body() dto: SendSmsDto) {
    return this.authService.sendSms(dto.phone);
  }

  @Post('verify-sms')
  @ApiOperation({ summary: 'Проверка кода из SMS' })
  @ApiResponse({
    status: 200,
    description: 'Код подтвержден, возвращается пара токенов',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный код подтверждения или истек срок его действия',
  })
  async verifySms(@Body() dto: VerifySmsDto) {
    return this.authService.verifySms(dto.phone, dto.code);
  }

  @Post('admin/login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Войти в систему администратору (по логину и паролю)',
  })
  @ApiBody({
    type: AdminLoginDto,
  })
  async loginAdmin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto.login, dto.password);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Обновить токены',
  })
  @ApiResponse({
    status: 200,
    description: 'Токены успешно обновлены',
  })
  @ApiResponse({
    status: 401,
    description: 'Недействительный refresh токен',
  })
  async refreshTokens(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Выход из системы',
    description: 'Очищает FCM токен пользователя и отключает push-уведомления',
  })
  @ApiResponse({
    status: 200,
    description: 'Пользователь успешно вышел из системы',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Вы успешно вышли из системы',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Пользователь не авторизован',
  })
  async logout(@UserId() userId: number) {
    return this.authService.logout(userId);
  }
}
