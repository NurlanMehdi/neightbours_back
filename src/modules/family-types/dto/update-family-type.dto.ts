import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateFamilyTypeDto {
  @ApiProperty({ description: 'Название типа семьи', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Описание типа семьи', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Иконка типа семьи', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ description: 'Цвет типа семьи', required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ description: 'Активен ли тип семьи', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
} 