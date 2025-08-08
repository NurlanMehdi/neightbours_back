import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class DocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByType(type: 'license' | 'privacy') {
    const documentType = type === 'license' ? 'LICENSE' : 'PRIVACY';
    return this.prisma.document.findUnique({
      where: { type: documentType as any }
    });
  }

  async upsert(type: 'license' | 'privacy', data: { title: string; content: string }) {
    const documentType = type === 'license' ? 'LICENSE' : 'PRIVACY';
    return this.prisma.document.upsert({
      where: { type: documentType as any },
      update: {
        title: data.title,
        content: data.content
      },
      create: {
        title: data.title,
        content: data.content,
        type: documentType as any
      }
    });
  }
}