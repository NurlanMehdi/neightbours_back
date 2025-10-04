import { PrivateMessageDto } from '../dto/private-message.dto';

/**
 * Преобразует сообщение из базы данных в формат PrivateMessageDto
 * @param message - Сообщение из базы данных с включенными отношениями
 * @returns Объект в формате PrivateMessageDto
 */
export const toPrivateMessageDto = (message: any): PrivateMessageDto => ({
  id: message.id,
  conversationId: message.conversationId,
  senderId: message.senderId,
  text: message.text,
  replyToMessageId: message.replyToId ?? null,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
  isDeleted: false, // Private messages don't have soft delete, so always false
  user: message.sender
    ? {
        id: message.sender.id,
        firstName: message.sender.firstName,
        lastName: message.sender.lastName,
        avatar: message.sender.avatar,
      }
    : null,
  replyTo: message.replyTo
    ? {
        id: message.replyTo.id,
        text: message.replyTo.text,
        senderId: message.replyTo.senderId,
        createdAt: message.replyTo.createdAt,
        user: message.replyTo.sender
          ? {
              id: message.replyTo.sender.id,
              firstName: message.replyTo.sender.firstName,
              lastName: message.replyTo.sender.lastName,
              avatar: message.replyTo.sender.avatar,
            }
          : null,
      }
    : null,
});
