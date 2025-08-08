import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CommunityMinimalDto {
  @ApiProperty({
    description: 'ID сообщества',
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Название сообщества',
    example: 'ЖК "Солнечный"',
  })
  @Expose()
  name: string;
}
