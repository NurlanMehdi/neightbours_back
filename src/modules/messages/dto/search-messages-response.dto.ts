import { ApiProperty } from '@nestjs/swagger';
import { EventMessage, CommunityMessage, PrivateMessage } from '@prisma/client';

/**
 * DTO для результатов поиска сообщений
 */
export class SearchMessagesResponseDto {
  @ApiProperty({
    description: 'Сообщения из событий',
    type: 'array',
    example: [
      {
        id: 1,
        eventId: 5,
        userId: 2,
        text: 'hello world',
        createdAt: '2025-09-30T12:00:00.000Z',
        updatedAt: '2025-09-30T12:00:00.000Z',
        replyToMessageId: null,
        isDeleted: false,
        isModerated: true,
      },
    ],
  })
  events: EventMessage[];

  @ApiProperty({
    description: 'Сообщения из сообществ',
    type: 'array',
    example: [
      {
        id: 12,
        communityId: 3,
        userId: 4,
        text: 'hello world',
        createdAt: '2025-09-30T12:00:00.000Z',
        updatedAt: '2025-09-30T12:00:00.000Z',
        replyToMessageId: null,
        isDeleted: false,
        isModerated: true,
      },
    ],
  })
  communities: CommunityMessage[];

  @ApiProperty({
    description: 'Приватные сообщения',
    type: 'array',
    example: [
      {
        id: 8,
        conversationId: 7,
        senderId: 2,
        text: 'hello world',
        createdAt: '2025-09-30T12:00:00.000Z',
        updatedAt: '2025-09-30T12:00:00.000Z',
        replyToId: null,
      },
    ],
  })
  private: PrivateMessage[];
}

