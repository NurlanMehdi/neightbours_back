import { BaseException } from './base.exception';
import { HttpStatus } from '@nestjs/common';

/**
 * Исключение «Пользователь не найден»
 */
export class UserNotFoundException extends BaseException {
  constructor(message = 'Пользователь не найден') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

/**
 * Исключение «Пользователь уже заблокирован»
 */
export class UserAlreadyBlockedException extends BaseException {
  constructor(message = 'Пользователь уже заблокирован') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Исключение «Пользователь уже разблокирован»
 */
export class UserAlreadyUnblockedException extends BaseException {
  constructor(message = 'Пользователь уже разблокирован') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Исключение «Блокировка не найдена»
 */
export class BlockingNotFoundException extends BaseException {
  constructor(message = 'Блокировка не найдена') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

/**
 * Исключение «Блокировка неактивна»
 */
export class BlockingAlreadyInactiveException extends BaseException {
  constructor(message = 'Блокировка не неактивна') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Исключение «Email уже существует»
 */
export class EmailAlreadyException extends BaseException {
  constructor(message = 'Неверный email') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}
