import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { TransformToFloat } from '../../../common/utils/form-data-transformers.util';

export class CreateCommunityDto {
  @ApiProperty({
    description: 'Название сообщества',
    example: 'Мой район',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Широта местоположения',
    example: 55.7558,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @TransformToFloat()
  latitude?: number;

  @ApiProperty({
    description: 'Долгота местоположения',
    example: 37.6173,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @TransformToFloat()
  longitude?: number;
}
