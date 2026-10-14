import { Injectable, Logger } from '@nestjs/common';
import { ChatMode, Prisma } from '@prisma/client';
import { Namespace } from 'socket.io';

export const inboxUserRoom = (userId: string) => `user:${userId}`;

export type InboxMessage = Prisma.DirectMessageGetPayload<{
  include: { sender: { select: { id: true; name: true; role: true } } };
}>;

@Injectable()
export class DirectMessageEvents {
  private readonly logger = new Logger(DirectMessageEvents.name);
  private server?: Namespace;

  setServer(server: Namespace) {
    this.server = server;
  }

  publishConversationMode(status: {
    buyerId: string;
    sellerId: string;
    mode: ChatMode;
    version: number;
  }) {
    try {
      this.server
        ?.to([inboxUserRoom(status.buyerId), inboxUserRoom(status.sellerId)])
        .emit('conversation_mode_changed', status);
    } catch {
      this.logger.warn('Không thể phát trạng thái hội thoại Inbox.');
    }
  }

  publishMessage(message: InboxMessage) {
    // Socket là thông báo sau khi lưu; lỗi phát không làm mất tin trong DB.
    try {
      this.server
        ?.to([
          inboxUserRoom(message.senderId),
          inboxUserRoom(message.receiverId),
        ])
        .emit('new_message', message);
    } catch {
      this.logger.warn(`Không thể phát new_message cho tin ${message.id}.`);
    }
  }
}
