import { HttpException, HttpStatus } from '@nestjs/common';

export class PropertyResourceNotFoundException extends HttpException {
  constructor(id: number) {
    super(
      `Ресурс объекта недвижимости с ID ${id} не найден`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class PropertyResourceAccessDeniedException extends HttpException {
  constructor() {
    super(
      'Доступ к ресурсу объекта недвижимости запрещен',
      HttpStatus.FORBIDDEN,
    );
  }
}

export class PropertyNotFoundException extends HttpException {
  constructor(id: number) {
    super(`Объект недвижимости с ID ${id} не найден`, HttpStatus.NOT_FOUND);
  }
}

export class PropertyAccessDeniedException extends HttpException {
  constructor() {
    super('Доступ к объекту недвижимости запрещен', HttpStatus.FORBIDDEN);
  }
}
