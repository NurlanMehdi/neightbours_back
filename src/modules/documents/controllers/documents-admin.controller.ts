import { Body, Controller, Param, Put, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { DocumentService } from '../services/document.service';
import { DocumentResponseDto, UpdateDocumentDto } from '../dto';

@ApiTags('Admin - Documents')
@Controller('admin/documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class DocumentsAdminController {
  constructor(private readonly documentService: DocumentService) {}

  @Put(':type')
  @ApiOperation({
    summary: 'Update document by type',
    description:
      "Update a document (license or privacy policy) by its type. Creates the document if it doesn't exist.",
  })
  @ApiParam({
    name: 'type',
    enum: ['license', 'privacy'],
    description: 'The type of document to update',
    example: 'license',
  })
  @ApiBody({
    type: UpdateDocumentDto,
    description:
      'Document data to update. Both title and content are optional.',
  })
  @ApiResponse({
    status: 200,
    description: 'Document updated successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid document type or request body',
  })
  async updateDocument(
    @Param('type') type: 'license' | 'privacy',
    @Body() data: UpdateDocumentDto,
  ): Promise<DocumentResponseDto> {
    return this.documentService.updateDocumentByType(type, data);
  }
}
