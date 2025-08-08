import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export const ApiStandardResponses = () => {
  return applyDecorators(
    ApiResponse({
      status: 400,
      description: 'Неверные данные',
    }),
    ApiResponse({
      status: 401,
      description: 'Пользователь не авторизован',
    }),
    ApiResponse({
      status: 403,
      description: 'Нет доступа',
    }),
    ApiResponse({
      status: 404,
      description: 'Ресурс не найден',
    }),
  );
};
