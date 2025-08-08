import { HttpException, HttpStatus } from '@nestjs/common';

export class FileNotFoundException extends HttpException {
  constructor() {
    super('Файл не найден', HttpStatus.NOT_FOUND);
  }
}

export class InvalidFileTypeException extends HttpException {
  constructor() {
    super('Недопустимый тип файла', HttpStatus.BAD_REQUEST);
  }
}

export class FileSizeExceededException extends HttpException {
  constructor() {
    super('Размер файла превышает допустимый', HttpStatus.BAD_REQUEST);
  }
}
