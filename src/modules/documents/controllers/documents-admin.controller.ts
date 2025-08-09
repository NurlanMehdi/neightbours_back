import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { DocumentService } from '../services/document.service';
import { DocumentResponseDto, UpdateDocumentDto } from '../dto';

@ApiTags('Admin - Documents')
@Controller('admin/documents')
export class DocumentsAdminController {
  constructor(private readonly documentService: DocumentService) {}

  @Put(':type')
  @ApiOperation({ 
    summary: 'Update document by type',
    description: 'Update a document (license or privacy policy) by its type. Creates the document if it doesn\'t exist.'
  })
  @ApiParam({ 
    name: 'type', 
    enum: ['license', 'privacy'],
    description: 'The type of document to update',
    example: 'license'
  })
  @ApiBody({
    type: UpdateDocumentDto,
    description: 'Document data to update. Both title and content are optional.'
  })
  @ApiResponse({
    status: 200,
    description: 'Document updated successfully',
    type: DocumentResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid document type or request body'
  })
  async updateDocument(
    @Param('type') type: 'license' | 'privacy',
    @Body() data: UpdateDocumentDto
  ): Promise<DocumentResponseDto> {
    return this.documentService.updateDocumentByType(type, data);
  }
}