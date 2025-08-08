import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class SendSmsDto {
  @ApiProperty({
    description: 'Номер телефона, только 11 цифр, например 79001234567',
    example: '79001234567',
    type: String,
  })
  @Matches(/^7\d{10}$/, {
    message:
      'Номер телефона должен начинаться с 7 и содержать 11 цифр, например 79001234567',
  })
  phone: string;
}

export class VerifySmsDto {
  @ApiProperty({
    description: 'Номер телефона, только 11 цифр, например 79001234567',
    example: '79001234567',
    type: String,
  })
  @Matches(/^7\d{10}$/, {
    message:
      'Номер телефона должен начинаться с 7 и содержать 11 цифр, например 79001234567',
  })
  phone: string;

  @ApiProperty({
    description: 'Код подтверждения из SMS (6 цифр)',
    example: '123456',
  })
  @IsString()
  @Matches(/^\d{6}$/, {
    message: 'Код подтверждения должен состоять из 6 цифр',
  })
  code: string;
}
