import { useCallback, useEffect, useRef, useState } from 'react';
import apiClient from '../api/client';
import type {
  ConversationModeEvent,
  DirectMessage,
  InboxContact,
  SendMessageResponse,
} from '../components/inbox/types';
import { useAuth } from '../context/AuthContext';
import { useConversationMode } from './useConversationMode';
import { useInboxSocket } from './useInboxSocket';
import { usePaginatedConversation } from './usePaginatedConversation';

interface UseShopChatWidgetOptions {
  sellerId: string | null;
  isOpen: boolean;
}

export const useShopChatWidget = ({
  sellerId,
  isOpen,
}: UseShopChatWidgetOptions) => {
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isOpenRef = useRef(isOpen);
  const sellerIdRef = useRef(sellerId);
  const sendRequestIdRef = useRef(0);
  const unreadRequestIdRef = useRef(0);
  isOpenRef.current = isOpen;
  sellerIdRef.current = sellerId;

  const fetchInitialUnread = useCallback(async (targetSellerId: string) => {
    const requestId = ++unreadRequestIdRef.current;
    try {
      const response = await apiClient.get<InboxContact[]>('/messages/shops', {
        params: { includeSellerId: targetSellerId },
      });
      if (
        requestId !== unreadRequestIdRef.current ||
        sellerIdRef.current !== targetSellerId ||
        isOpenRef.current
      ) {
        return;
      }
      const matchedShop = response.data.find(
        (shop) => shop.id === targetSellerId,
      );
      setUnreadCount(matchedShop?.unreadCount ?? 0);
    } catch (requestError) {
      if (
        requestId === unreadRequestIdRef.current &&
        sellerIdRef.current === targetSellerId &&
        !isOpenRef.current
      ) {
        console.error('Lỗi khi tải số tin chưa đọc:', requestError);
      }
    }
  }, []);

  useEffect(() => {
    sendRequestIdRef.current++;
    unreadRequestIdRef.current++;
    setSending(false);
    setUnreadCount(0);
    setInputText('');
  }, [sellerId]);

  useEffect(() => {
    const requestCounter = unreadRequestIdRef;
    if (isOpen) {
      requestCounter.current++;
      setUnreadCount(0);
      return;
    }
    if (!sellerId) {
      requestCounter.current++;
      return;
    }

    void fetchInitialUnread(sellerId);
    return () => {
      requestCounter.current++;
    };
  }, [sellerId, isOpen, fetchInitialUnread]);

  const handleMarkedRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const conversation = usePaginatedConversation({
    conversationId: isOpen ? sellerId : null,
    endpointBase: '/messages/conversations',
    onMarkedRead: handleMarkedRead,
  });

  const conversationMode = useConversationMode(
    isOpen && sellerId ? `/messages/conversations/${sellerId}/mode` : null,
  );

  const handleSocketMessage = (message: DirectMessage) => {
    const activeSellerId = sellerIdRef.current;
    if (!user || !activeSellerId) return;

    const isRelevantConversation =
      (message.senderId === user.id && message.receiverId === activeSellerId) ||
      (message.senderId === activeSellerId && message.receiverId === user.id);
    if (!isRelevantConversation) return;

    if (isOpenRef.current) {
      conversation.appendMessages(message);
      if (message.senderId === activeSellerId) {
        setUnreadCount(0);
        void apiClient
          .patch(`/messages/conversations/${activeSellerId}/read`)
          .catch(() => {});
      }
      return;
    }

    if (message.senderId === activeSellerId) {
      setUnreadCount((current) => current + 1);
    }
  };

  const handleSocketReady = () => {
    const activeSellerId = sellerIdRef.current;
    if (!activeSellerId) return;

    if (isOpenRef.current) {
      void conversation.refreshLatest();
      void conversationMode.refresh();
      return;
    }

    void fetchInitialUnread(activeSellerId);
  };

  const handleModeChanged = (status: ConversationModeEvent) => {
    if (
      status.buyerId === user?.id &&
      status.sellerId === sellerIdRef.current
    ) {
      conversationMode.applyStatus(status);
    }
  };

  const socket = useInboxSocket(
    handleSocketMessage,
    handleSocketReady,
    handleModeChanged,
  );

  const handleSendMessage = async () => {
    const targetSellerId = sellerId;
    const message = inputText.trim();
    if (!targetSellerId || !message || sending) return;

    const requestId = ++sendRequestIdRef.current;
    setSending(true);
    conversation.setError('');
    try {
      const response = await apiClient.post<SendMessageResponse>(
        '/messages/conversations',
        { sellerId: targetSellerId, message },
      );
      if (
        requestId !== sendRequestIdRef.current ||
        sellerIdRef.current !== targetSellerId
      ) {
        return;
      }

      const { buyerMessage, aiMessage } = response.data;
      conversation.appendMessages(
        buyerMessage,
        ...(aiMessage ? [aiMessage] : []),
      );
      setInputText('');
      await conversationMode.refresh();
    } catch (requestError) {
      if (
        requestId !== sendRequestIdRef.current ||
        sellerIdRef.current !== targetSellerId
      ) {
        return;
      }
      console.error('Lỗi khi gửi tin nhắn:', requestError);
      conversation.setError('Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      if (requestId === sendRequestIdRef.current) {
        setSending(false);
      }
    }
  };

  return {
    inputText,
    setInputText,
    sending,
    unreadCount,
    conversation,
    conversationMode,
    error: conversation.error || conversationMode.error || socket.error,
    handleSendMessage,
  };
};
