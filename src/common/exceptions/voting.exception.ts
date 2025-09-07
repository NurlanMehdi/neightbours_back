import { BaseException } from './base.exception';

export class VotingNotFoundException extends BaseException {
  constructor() {
    super('Голосование не найдено', 404);
  }
}

export class VotingOptionNotFoundException extends BaseException {
  constructor() {
    super('Вариант ответа для голосования не найден', 404);
  }
}

export class UserNotParticipantException extends BaseException {
  constructor() {
    super('Пользователь не является участником мероприятия', 403);
  }
}

export class UserNotCommunityMemberException extends BaseException {
  constructor() {
    super('Пользователь не является членом сообщества', 403);
  }
}

export class UserAlreadyVotedException extends BaseException {
  constructor() {
    super('Пользователь уже проголосовал в данном мероприятии', 400);
  }
}

export class UserNotVotedException extends BaseException {
  constructor() {
    super('Пользователь не голосовал в данном мероприятии', 400);
  }
}

export class EventHasNoVotingException extends BaseException {
  constructor() {
    super('Мероприятие не содержит голосования', 400);
  }
}
