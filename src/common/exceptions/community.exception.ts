import { HttpException, HttpStatus } from '@nestjs/common';

export class CommunityDistanceException extends HttpException {
  constructor(distance: number) {
    super(
      `Расстояние между вашим местоположением и границей сообщества составляет ${distance.toFixed(2)} км. Максимальное допустимое расстояние: 0.5 км (500 метров)`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class CommunityCreatorException extends HttpException {
  constructor() {
    super(
      'Вы не можете вступить в сообщество, которое создали сами',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class UserAlreadyMemberException extends HttpException {
  constructor() {
    super(
      'Пользователь уже является участником этого сообщества',
      HttpStatus.BAD_REQUEST,
    );
  }
} 