import { HttpException, HttpStatus } from '@nestjs/common';

export class AiServiceUnavailableException extends HttpException {
  constructor(message: string = 'AI сервис временно недоступен') {
    super(message, HttpStatus.SERVICE_UNAVAILABLE);
  }
}

export class AiApiKeyMissingException extends HttpException {
  constructor(message: string = 'API ключ для AI сервиса не настроен') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class AiChatNotFoundException extends HttpException {
  constructor(message: string = 'Чат не найден') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class AiMessageTooLongException extends HttpException {
  constructor(message: string = 'Сообщение слишком длинное') {
    super(message, HttpStatus.BAD_REQUEST);
  }
} 