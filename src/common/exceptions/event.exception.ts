import { HttpException, HttpStatus } from '@nestjs/common';

export class EventNotFoundException extends HttpException {
  constructor() {
    super('Событие не найдено', HttpStatus.NOT_FOUND);
  }
}

export class EventAccessDeniedException extends HttpException {
  constructor() {
    super('Нет прав на редактирование события', HttpStatus.FORBIDDEN);
  }
}

export class UserNotInCommunityException extends HttpException {
  constructor() {
    super(
      'Пользователь не является участником сообщества',
      HttpStatus.FORBIDDEN,
    );
  }
}
