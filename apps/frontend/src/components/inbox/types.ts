export const MESSAGE_PAGE_SIZE = 5;

export interface InboxContact {
  id: string;
  name: string;
  unreadCount: number;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
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
  aiMessage: DirectMessage;
}

export type InboxView = 'buyer' | 'seller';
