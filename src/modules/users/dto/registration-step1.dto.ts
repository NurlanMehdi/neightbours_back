import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsNotEmpty } from 'class-validator';
import { Expose } from 'class-transformer';
import { TransformToFloat } from '../../../common/utils/form-data-transformers.util';

export class RegistrationStep1Dto {
  @ApiProperty({
    description: 'Широта',
    example: 55.7558,
  })
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  @TransformToFloat()
  latitude: number;

  @ApiProperty({
    description: 'Долгота',
    example: 37.6173,
  })
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  @TransformToFloat()
  longitude: number;

  @ApiProperty({
    description: 'Адрес',
    example: 'ул. Пушкина, д. 10',
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  address: string;
}
