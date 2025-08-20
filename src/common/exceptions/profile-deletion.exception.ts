import { HttpException, HttpStatus } from '@nestjs/common';

export class ProfileDeletionException extends HttpException {
  constructor(message = 'Ошибка при удалении профиля') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class DeletionRequestNotFoundException extends ProfileDeletionException {
  constructor() {
    super('Запрос на удаление не найден');
  }
}

export class InvalidDeletionCodeException extends ProfileDeletionException {
  constructor() {
    super('Недействительный код удаления');
  }
}

export class DeletionCodeExpiredException extends ProfileDeletionException {
  constructor() {
    super('Срок действия кода удаления истек');
  }
}

export class TooManyDeletionAttemptsException extends ProfileDeletionException {
  constructor() {
    super('Превышено максимальное количество попыток ввода кода');
  }
}

export class ActiveDeletionRequestExistsException extends ProfileDeletionException {
  constructor(code: string) {
    super(`У вас уже есть активный запрос на удаление профиля. Код: ${code}`);
  }
}

export class ProfileNotScheduledForDeletionException extends ProfileDeletionException {
  constructor() {
    super('Профиль не запланирован к удалению');
  }
}

export class DeletionCancellationExpiredException extends ProfileDeletionException {
  constructor() {
    super('Срок отмены удаления истек');
  }
}
