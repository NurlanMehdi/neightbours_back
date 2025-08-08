import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { SendSmsDto, VerifySmsDto } from '../dto/auth.dto';
import { AdminLoginDto } from '../dto/admin.login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

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
}
