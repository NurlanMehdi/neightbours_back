import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { DocumentService } from '../services/document.service';
import { DocumentResponseDto, UpdateDocumentDto } from '../dto';

@ApiTags('Documents')
@Controller('documents')
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