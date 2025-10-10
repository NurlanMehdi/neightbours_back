import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class JoinCommunityByCodeDto {
  @ApiProperty({
    description: 'Код для вступления в сообщество',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
