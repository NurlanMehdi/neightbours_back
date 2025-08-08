import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '@prisma/client';
import { IsRussianPhone } from '../../../common/validators/is-russian-phone.decorator';

export class CreateUserAdminDto {
  @ApiProperty({
    description: 'Телефон пользователя',
    example: '79097844501',
  })
  @IsString()
  @IsNotEmpty()
  @IsRussianPhone()
  phone: string;

  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Имя пользователя',
    example: 'Иван',
    required: false,
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    description: 'Фамилия пользователя',
    example: 'Иванов',
    required: false,
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    description: 'Отчество пользователя',
    example: 'Иванович',
    required: false,
  })
  @IsString()
  @IsOptional()
  middleName?: string;

  @ApiProperty({
    description: 'Роль пользователя',
    enum: UserRole,
    example: UserRole.USER,
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @ApiProperty({
    description: 'Логин пользователя (обязателен для ADMIN)',
    example: 'admin_login',
    required: false,
  })
  @ValidateIf((o) => o.role === UserRole.ADMIN)
  @IsString()
  @IsNotEmpty({ message: 'Логин обязателен для администратора' })
  login?: string;

  @ApiProperty({
    description: 'Пароль пользователя (обязателен для ADMIN)',
    example: 'Password123!',
    required: false,
  })
  @ValidateIf((o) => o.role === UserRole.ADMIN)
  @IsString()
  @IsNotEmpty({ message: 'Пароль обязателен для администратора' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, цифры и специальные символы',
    },
  )
  password?: string;
}
