import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PropertyDto {
  @ApiProperty({ description: 'ID объекта недвижимости' })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Название объекта недвижимости' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Фотография объекта', required: false, name: 'picture' })
  @Expose()
  picture?: string;

  @ApiProperty({
    description: 'Статус подтверждения объекта',
    enum: ['UNVERIFIED', 'VERIFIED'],
    example: 'UNVERIFIED',
  })
  @Expose()
  verificationStatus: string;
}
