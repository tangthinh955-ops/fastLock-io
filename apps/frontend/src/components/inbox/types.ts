export const MESSAGE_PAGE_SIZE = 5;

export interface InboxContact {
  id: string;
  name: string;
  unreadCount: number;
}

export type MessageSource = 'BUYER' | 'SELLER' | 'AI' | 'SYSTEM';

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  source: MessageSource;
  qrUrl: string | null;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
}

export interface SendMessageResponse {
  buyerMessage: DirectMessage;
  aiMessage: DirectMessage | null;
}

export type InboxView = 'buyer' | 'seller';
