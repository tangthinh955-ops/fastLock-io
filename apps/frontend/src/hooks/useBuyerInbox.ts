import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import type {
  InboxContact,
  SendMessageResponse,
} from '../components/inbox/types';
import { usePaginatedConversation } from './usePaginatedConversation';

export const useBuyerInbox = () => {
  const [searchParams] = useSearchParams();
  const requestedSellerId = searchParams.get('sellerId');
  const [shops, setShops] = useState<InboxContact[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [loadingShops, setLoadingShops] = useState(true);
  const [shopsError, setShopsError] = useState('');
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchShops = async () => {
      setLoadingShops(true);
      setShopsError('');
      try {
        const response = await apiClient.get<InboxContact[]>('/messages/shops');
        if (!active) return;

        setShops(response.data);
        setSelectedShopId((currentShopId) => {
          if (
            requestedSellerId &&
            response.data.some((shop) => shop.id === requestedSellerId)
          ) {
            return requestedSellerId;
          }
          if (
            currentShopId &&
            response.data.some((shop) => shop.id === currentShopId)
          ) {
            return currentShopId;
          }
          return response.data[0]?.id ?? null;
        });
      } catch (requestError) {
        console.error('Lỗi khi tải danh sách shop:', requestError);
        if (active) setShopsError('Không thể tải danh sách shop.');
      } finally {
        if (active) setLoadingShops(false);
      }
    };

    fetchShops();
    return () => {
      active = false;
    };
  }, [requestedSellerId]);

  const handleMarkedRead = useCallback((shopId: string) => {
    setShops((currentShops) =>
      currentShops.map((shop) =>
        shop.id === shopId ? { ...shop, unreadCount: 0 } : shop,
      ),
    );
  }, []);

  const conversation = usePaginatedConversation({
    conversationId: selectedShopId,
    endpointBase: '/messages/conversations',
    onMarkedRead: handleMarkedRead,
  });

  const handleSendMessage = async () => {
    const message = inputText.trim();
    if (!selectedShopId || !message || sending) return;

    setSending(true);
    conversation.setError('');
    try {
      const response = await apiClient.post<SendMessageResponse>(
        '/messages/conversations',
        { sellerId: selectedShopId, message },
      );
      conversation.appendMessages(
        response.data.buyerMessage,
        response.data.aiMessage,
      );
      setInputText('');
    } catch (requestError) {
      console.error('Lỗi khi gửi tin nhắn:', requestError);
      conversation.setError('Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  return {
    shops,
    selectedShopId,
    selectedShop: shops.find((shop) => shop.id === selectedShopId),
    loadingShops,
    inputText,
    sending,
    error: shopsError || conversation.error,
    setSelectedShopId,
    setInputText,
    handleSendMessage,
    conversation,
  };
};
