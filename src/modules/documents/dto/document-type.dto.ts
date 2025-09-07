import { ApiProperty } from '@nestjs/swagger';

export class DocumentTypeParamDto {
  @ApiProperty({
    description: 'Document type',
    enum: ['license', 'privacy'],
    example: 'license',
  })
  type: 'license' | 'privacy';
}
