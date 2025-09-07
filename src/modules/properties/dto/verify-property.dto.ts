import { ApiProperty } from '@nestjs/swagger';
import { IsLatitude, IsLongitude } from 'class-validator';
import { TransformToFloat } from '../../../common/utils/form-data-transformers.util';

export class VerifyPropertyDto {
  @ApiProperty({
    description: 'Широта местоположения пользователя',
    example: 55.7558,
    type: 'number',
  })
  @IsLatitude()
  @TransformToFloat()
  userLatitude: number;

  @ApiProperty({
    description: 'Долгота местоположения пользователя',
    example: 37.6176,
    type: 'number',
  })
  @IsLongitude()
  @TransformToFloat()
  userLongitude: number;
}
