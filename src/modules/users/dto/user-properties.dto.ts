import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserPropertyResponseDto {
  @Expose()
  @ApiProperty({ description: 'ID объекта недвижимости', example: 101 })
  id: number;

  @Expose()
  @ApiProperty({ description: 'Название объекта недвижимости', example: 'Дом у озера' })
  name: string;

  @Expose()
  @ApiProperty({
    description: 'Фотография объекта (путь к файлу)',
    example: 'properties/123.jpg',
    nullable: true,
  })
  picture: string | null;

  @Expose()
  @ApiProperty({
    description: 'Статус подтверждения объекта',
    enum: ['UNVERIFIED', 'VERIFIED'],
    example: 'VERIFIED',
  })
  verificationStatus: string;
}
