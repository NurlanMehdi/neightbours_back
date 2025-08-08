import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FilesService } from '../services/files.service';
import { extname } from 'path';

@ApiTags('Файлы')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get(':filename')
  @ApiOperation({ summary: 'Получение файла по имени' })
  @ApiParam({
    name: 'filename',
    description: 'Имя файла',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Файл успешно получен',
  })
  @ApiResponse({
    status: 401,
    description: 'Пользователь не авторизован',
  })
  @ApiResponse({
    status: 404,
    description: 'Файл не найден',
  })
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    const file = await this.filesService.getFile(filename);
    
    // Определяем MIME-тип на основе расширения файла
    const extension = extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (extension) {
      case '.svg':
        contentType = 'image/svg+xml';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      default:
        contentType = 'application/octet-stream';
    }
    
    // Устанавливаем заголовки
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Кэширование на 1 год
    
    file.pipe(res);
  }
}
