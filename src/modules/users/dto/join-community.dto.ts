import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsLatitude, IsLongitude } from 'class-validator';
import { TransformToFloat } from '../../../common/utils/form-data-transformers.util';

export class JoinCommunityDto {
  @ApiProperty({
    description: 'Код для вступления в сообщество',
    example: '123456',
  })
  @IsString()
  communityCode: string;

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
