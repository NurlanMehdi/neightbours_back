import { HttpException, HttpStatus } from '@nestjs/common';

export class PropertyDistanceException extends HttpException {
  constructor(distance: number) {
    super(
      `Расстояние между вашим местоположением и объектом недвижимости составляет ${distance.toFixed(2)} км. Максимальное допустимое расстояние: 0.1 км (100 метров)`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class PropertyVerificationException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class PropertyAlreadyVerifiedException extends HttpException {
  constructor() {
    super(
      'Вы уже подтверждали этот объект недвижимости',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class PropertyOwnVerificationException extends HttpException {
  constructor() {
    super(
      'Вы не можете подтверждать собственный объект недвижимости',
      HttpStatus.BAD_REQUEST,
    );
  }
} 