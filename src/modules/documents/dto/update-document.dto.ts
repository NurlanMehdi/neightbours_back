import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateDocumentDto {
  @ApiProperty({
    description: 'Document title',
    example: 'Лицензионное соглашение',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Document content',
    example: 'Содержание лицензионного соглашения...',
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string;
}
