import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateQualificationDto {
  @ApiProperty({
    description: 'Название квалификации',
    example: 'Электрик',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Описание квалификации',
    example: 'Специалист по электромонтажным работам',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Иконка квалификации',
    example: '⚡',
    required: false,
  })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({
    description: 'Цвет квалификации',
    example: '#FF5733',
    required: false,
  })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({
    description: 'Активна ли квалификация',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
