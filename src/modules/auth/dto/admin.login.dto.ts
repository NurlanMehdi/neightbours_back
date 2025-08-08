import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { IsRussianPhone } from '../../../common/validators/is-russian-phone.decorator';

export class AdminLoginDto {
  @ApiProperty({ description: 'Логин (номер телефона)', required: true })
  @IsString()
  @IsRussianPhone()
  login: string;

  @ApiProperty({ description: 'Пароль', required: true })
  @IsString()
  password: string;
}
