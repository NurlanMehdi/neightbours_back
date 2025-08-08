import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { TransformToFloat } from '../../../common/utils/form-data-transformers.util';

export class CreateCommunityAdminDto {
  @ApiProperty({
    description: 'Название сообщества',
    example: 'ЖК "Солнечный"',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Описание сообщества',
    example: 'Сообщество жителей ЖК "Солнечный"',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Адрес сообщества',
    example: 'ул. Солнечная, д. 1',
  })
  @IsString()
  @IsOptional()
  address: string;

  @ApiProperty({
    description: 'Широта местоположения',
    example: 55.7558,
  })
  @IsNumber()
  @IsNotEmpty()
  @TransformToFloat()
  latitude: number;

  @ApiProperty({
    description: 'Долгота местоположения',
    example: 37.6173,
  })
  @IsNumber()
  @IsNotEmpty()
  @TransformToFloat()
  longitude: number;
}
