import { IsEnum } from 'class-validator';
import { ChatMode } from '@prisma/client';

export class UpdateConversationModeDto {
  @IsEnum(ChatMode, { message: 'Chế độ phải là AI hoặc HUMAN.' })
  mode: ChatMode;
}
