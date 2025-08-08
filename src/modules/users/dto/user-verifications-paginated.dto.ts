import { ApiProperty } from '@nestjs/swagger';
import { PropertyDto } from '../../properties/dto/property.dto';

export class UserVerificationsPaginatedDto {
  @ApiProperty({
    description: 'Список объектов недвижимости, подтвержденных пользователем',
    type: [PropertyDto],
  })
  data: PropertyDto[];

  @ApiProperty({
    description: 'Общее количество подтверждений',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Номер текущей страницы',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Количество элементов на странице',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Общее количество страниц',
    example: 3,
  })
  totalPages: number;
} 