import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class CommunityShortDto {
  @Expose()
  @ApiProperty({ description: 'ID сообщества', example: 2 })
  id: number;

  @Expose()
  @ApiProperty({
    description: 'Название сообщества',
    example: 'ЖК Солнечный',
  })
  name: string;
}
