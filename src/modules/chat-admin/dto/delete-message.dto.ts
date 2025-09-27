import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min, IsEnum, IsOptional } from 'class-validator';
import { AdminChatType } from './messages-query.dto';

export class DeleteMessageDto {
  @ApiProperty({ description: 'ID сообщения для удаления', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number;

  @ApiProperty({ 
    description: 'Тип чата (COMMUNITY или EVENT)', 
    enum: AdminChatType, 
    example: AdminChatType.COMMUNITY,
    required: false
  })
  @IsOptional()
  @IsEnum(AdminChatType)
  chatType?: AdminChatType;
}
