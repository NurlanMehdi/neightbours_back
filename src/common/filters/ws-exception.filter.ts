import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class WsExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client = ctx.getClient<Socket>();

    let status = 'error';
    let message = 'Internal server error';
    let cause = null;

    if (exception instanceof WsException) {
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = 'error';
      message = exception.message;
      cause = {
        statusCode: exception.getStatus(),
        error: exception.getResponse(),
      };
    } else if (exception instanceof Error) {
      message = exception.message;
      cause = {
        name: exception.name,
        stack: exception.stack,
      };
    }

    // Отправляем ошибку клиенту в формате Socket.IO
    client.emit('exception', {
      status,
      message,
      cause,
    });

    // Логируем ошибку
    console.error('WebSocket Exception:', {
      clientId: client.id,
      exception:
        exception instanceof Error ? exception.message : String(exception),
      stack: exception instanceof Error ? exception.stack : undefined,
    });
  }
}
