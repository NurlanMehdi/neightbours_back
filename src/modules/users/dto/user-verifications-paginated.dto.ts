import { ApiProperty } from '@nestjs/swagger';
import { PropertyDto } from '../../properties/dto/property.dto';

export class UserVerificationsPaginatedDto {
  @ApiProperty({
    description: 'Список объектов недвижимости, подтвержденных пользователем',
    example: [
      {
        property: {
          id: 1,
          name: 'Частный дом на Рублевке',
          category: 'PRIVATE_HOUSE',
          latitude: 55.7558,
          longitude: 37.6176,
          photo: '/uploads/house1.jpg',
          verificationStatus: 'VERIFIED',
          verificationCount: 3,
          verifiedUserIds: [1, 2, 3],
          createdById: 1,
          createdBy: 'Иван Петров',
          createdAt: '2025-08-09T10:52:53.078Z',
          updatedAt: '2025-08-09T10:52:53.078Z',
        },
        verifiedAt: '2025-08-09T10:52:53.078Z',
      },
    ],
  })
  data: any[];

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
