import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { UserGender } from '@prisma/client';

export class BaseUserDto {
  @Expose()
  @ApiProperty({
    description: 'Имя пользователя',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @Expose()
  @ApiProperty({
    description: 'Фамилия пользователя',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @Expose()
  @ApiProperty({
    description: 'Пол пользователя',
    required: false,
    enum: UserGender,
    example: UserGender.MALE,
  })
  @IsOptional()
  @IsEnum(UserGender)
  gender?: UserGender;

  @Expose()
  @ApiProperty({
    description: 'Дата рождения пользователя',
    required: false,
    example: '1990-01-01',
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @Expose()
  @ApiProperty({
    description: 'Email пользователя',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email: string;
}
