import { Injectable, Logger } from '@nestjs/common';
import { FileNotFoundException } from '../../../common/exceptions/file.exception';
import { createReadStream, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly uploadsDir = join(process.cwd(), 'uploads');

  constructor() {
    // Создаем директорию для загрузок, если она не существует
    if (!existsSync(this.uploadsDir)) {
      mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Сохранение загруженного файла
   * @param file Загруженный файл
   * @returns Путь к сохраненному файлу
   */
  async saveFile(file: Express.Multer.File): Promise<string> {
    try {
      const filename = `${uuidv4()}-${file.originalname}`;
      const filePath = join(this.uploadsDir, filename);

      writeFileSync(filePath, file.buffer);

      this.logger.log(`Файл успешно сохранен: ${filename}`);
      return filename;
    } catch (error) {
      this.logger.error(`Ошибка при сохранении файла: ${error.message}`);
      throw new Error('Ошибка при сохранении файла');
    }
  }

  /**
   * Получение файла по имени
   * @param filename Имя файла
   * @returns Поток для чтения файла
   */
  async getFile(filename: string) {
    const filePath = join(this.uploadsDir, filename);

    if (!existsSync(filePath)) {
      this.logger.warn(`Файл не найден: ${filePath}`);
      throw new FileNotFoundException();
    }

    try {
      return createReadStream(filePath);
    } catch (error) {
      this.logger.error(`Ошибка при получении файла: ${error.message}`);
      throw new FileNotFoundException();
    }
  }
}
