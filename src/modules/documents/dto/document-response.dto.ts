import { ApiProperty } from '@nestjs/swagger';

export class DocumentResponseDto {
  @ApiProperty({
    description: 'Document ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Document title',
    example: 'Лицензионное соглашение',
  })
  title: string;

  @ApiProperty({
    description: 'Document content',
    example: 'Содержание лицензионного соглашения...',
  })
  content: string;

  @ApiProperty({
    description: 'Document type',
    enum: ['license', 'privacy'],
    example: 'license',
  })
  type: 'license' | 'privacy';

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: string;
}
