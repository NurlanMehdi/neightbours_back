import { BaseException } from './base.exception';

export class InvalidPhoneNumberException extends BaseException {
  constructor() {
    super('Неверный формат номера телефона', 400);
  }
}

export class InvalidSmsCodeException extends BaseException {
  constructor() {
    super('Неверный код подтверждения', 400);
  }
}

export class SmsCodeExpiredException extends BaseException {
  constructor() {
    super('Срок действия кода подтверждения истек', 400);
  }
}

export class UnauthorizedException extends BaseException {
  constructor() {
    super('Необходима авторизация', 401);
  }
}
