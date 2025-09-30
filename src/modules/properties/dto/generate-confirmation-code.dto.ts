import { ApiProperty } from '@nestjs/swagger';

export class GenerateConfirmationCodeResponseDto {
  @ApiProperty({
    description: 'Сгенерированный код подтверждения',
    example: '123456',
  })
  code: string;

  @ApiProperty({ description: 'Время истечения кода' })
  expiresAt: Date;
}
