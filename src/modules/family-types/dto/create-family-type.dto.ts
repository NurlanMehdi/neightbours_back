import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateFamilyTypeDto {
  @ApiProperty({ description: 'Название типа семьи' })
  @IsString()
  @IsNotEmpty()
  name: string;

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
}
