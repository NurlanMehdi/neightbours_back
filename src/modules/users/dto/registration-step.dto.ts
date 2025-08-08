import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class RegistrationStepDto {
  @ApiProperty({
    description: 'Текущий шаг регистрации',
    example: 1,
  })
  @Expose()
  step: number;
}
