import { Injectable } from '@nestjs/common';
import { DocumentRepository } from '../repositories/document.repository';
import { DocumentResponseDto } from '../dto';

@Injectable()
export class DocumentService {
  constructor(private readonly documentRepository: DocumentRepository) {}

  async getDocumentByType(type: 'license' | 'privacy'): Promise<DocumentResponseDto> {
    const document = await this.documentRepository.findByType(type);

    if (!document) {
      const defaultTitle = type === 'license' 
        ? 'Лицензионное соглашение' 
        : 'Политика конфиденциальности';
      
      return {
        id: '',
        title: defaultTitle,
        content: '',
        type: type as 'license' | 'privacy',
        updatedAt: new Date().toISOString()
      };
    }

    return {
      id: document.id,
      title: document.title,
      content: document.content,
      type: document.type === 'LICENSE' ? 'license' as const : 'privacy' as const,
      updatedAt: document.updatedAt.toISOString()
    };
  }

  async updateDocumentByType(type: 'license' | 'privacy', data: { title?: string; content?: string }): Promise<DocumentResponseDto> {
    const defaultTitle = type === 'license' 
      ? 'Лицензионное соглашение' 
      : 'Политика конфиденциальности';
    
    const document = await this.documentRepository.upsert(type, {
      title: data.title || defaultTitle,
      content: data.content || ''
    });

    return {
      id: document.id,
      title: document.title,
      content: document.content,
      type: document.type === 'LICENSE' ? 'license' as const : 'privacy' as const,
      updatedAt: document.updatedAt.toISOString()
    };
  }
}