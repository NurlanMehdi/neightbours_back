import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DocumentService } from '../services/document.service';
import { DocumentResponseDto } from '../dto';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentService: DocumentService) {}

  @Get(':type')
  @ApiOperation({ 
    summary: 'Get document by type',
    description: 'Retrieve a document (license or privacy policy) by its type. If the document doesn\'t exist, returns a default template.'
  })
  @ApiParam({ 
    name: 'type', 
    enum: ['license', 'privacy'],
    description: 'The type of document to retrieve',
    example: 'license'
  })
  @ApiResponse({
    status: 200,
    description: 'Document retrieved successfully',
    type: DocumentResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid document type'
  })
  async getDocument(@Param('type') type: 'license' | 'privacy'): Promise<DocumentResponseDto> {
    return this.documentService.getDocumentByType(type);
  }


}