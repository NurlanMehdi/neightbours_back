import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional } from 'class-validator';
import { Expose } from 'class-transformer';

export class RegistrationStep2Dto {
  @ApiProperty({
    description: 'Имя',
    example: 'Иван',
  })
  @IsString()
  @Expose()
  firstName: string;

  @ApiProperty({
    description: 'Фамилия',
    example: 'Иванов',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Expose()
  lastName?: string;

  @ApiProperty({
    description: 'Email',
    example: 'ivan@example.com',
  })
  @IsEmail()
  @IsOptional()
  @Expose()
  email: string;
}
