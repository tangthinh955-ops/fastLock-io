import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import type {
  InboxContact,
  DirectMessage,
  SendMessageResponse,
} from '../components/inbox/types';
import { usePaginatedConversation } from './usePaginatedConversation';
import { useConversationMode } from './useConversationMode';
import { useAuth } from '../context/AuthContext';
import { useInboxSocket } from './useInboxSocket';
import {
  orderInboxContacts,
  rememberInboxActivity,
} from '../utils/inboxMessages';

interface UseBuyerInboxOptions {
  autoSelectFirst?: boolean;
  isChatVisible?: boolean;
}

export const useBuyerInbox = ({
  autoSelectFirst = true,
  isChatVisible = true,
}: UseBuyerInboxOptions = {}) => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedSellerId = searchParams.get('sellerId');
  const [shops, setShops] = useState<InboxContact[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [loadingShops, setLoadingShops] = useState(true);
  const [shopsError, setShopsError] = useState('');
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const activityRef = useRef(
    new Map<string, Pick<DirectMessage, 'id' | 'createdAt'>>(),
  );
  const contactsRequestRef = useRef(0);
  const sendRequestIdRef = useRef(0);
  const requestedSellerIdRef = useRef<string | null>(requestedSellerId);
  requestedSellerIdRef.current = requestedSellerId;
  const autoSelectFirstRef = useRef(autoSelectFirst);
  autoSelectFirstRef.current = autoSelectFirst;
  const isChatVisibleRef = useRef(isChatVisible);
  isChatVisibleRef.current = isChatVisible;
  const loadingShopsRef = useRef(loadingShops);
  loadingShopsRef.current = loadingShops;
  const selectedShopIdRef = useRef<string | null>(selectedShopId);
  selectedShopIdRef.current = selectedShopId;
  const shopsRef = useRef<InboxContact[]>(shops);
  shopsRef.current = shops;
  const prevIsChatVisibleRef = useRef(isChatVisible);
  const prevSelectedShopIdRef = useRef<string | null>(selectedShopId);
  const conversationMode = useConversationMode(
    selectedShopId ? `/messages/conversations/${selectedShopId}/mode` : null,
  );

  const fetchShops = useCallback(async (initial = false) => {
    const request = ++contactsRequestRef.current;
    const requestedId = requestedSellerIdRef.current;
    if (initial) setLoadingShops(true);
    setShopsError('');
    try {
      const response = await apiClient.get<InboxContact[]>('/messages/shops', {
        params: requestedId ? { includeSellerId: requestedId } : undefined,
      });
      if (request !== contactsRequestRef.current) return;

      const ordered = orderInboxContacts(response.data, activityRef.current);
      setShops((current) =>
        orderInboxContacts(
          [
            ...ordered,
            ...current.filter(
              (shop) =>
                activityRef.current.has(shop.id) &&
                !ordered.some((entry) => entry.id === shop.id),
            ),
          ],
          activityRef.current,
        ),
      );
      setSelectedShopId((currentShopId) => {
        const targetRequestedId = requestedSellerIdRef.current;
        if (
          targetRequestedId &&
          response.data.some((shop) => shop.id === targetRequestedId)
        ) {
          return targetRequestedId;
        }
        if (
          currentShopId &&
          response.data.some((shop) => shop.id === currentShopId)
        ) {
          return currentShopId;
        }
        return autoSelectFirstRef.current ? (ordered[0]?.id ?? null) : null;
      });
    } catch (requestError) {
      console.error('Lỗi khi tải danh sách shop:', requestError);
      if (request === contactsRequestRef.current)
        setShopsError('Không thể tải danh sách shop.');
    } finally {
      if (request === contactsRequestRef.current) setLoadingShops(false);
    }
  }, []);

  useEffect(() => {
    const requestCounter = contactsRequestRef;
    void fetchShops(true);
    return () => {
      requestCounter.current++;
    };
  }, [fetchShops]);

  useEffect(() => {
    if (!requestedSellerId) return;
    if (shopsRef.current.some((shop) => shop.id === requestedSellerId)) {
      setSelectedShopId(requestedSellerId);
    } else if (!loadingShopsRef.current) {
      void fetchShops(false);
    }
  }, [requestedSellerId, fetchShops]);

  useEffect(() => {
    if (autoSelectFirst && !selectedShopId && shops.length > 0) {
      setSelectedShopId(
        requestedSellerId && shops.some((shop) => shop.id === requestedSellerId)
          ? requestedSellerId
          : shops[0].id,
      );
    }
  }, [autoSelectFirst, selectedShopId, shops, requestedSellerId]);

  useEffect(() => {
    const requestCounter = sendRequestIdRef;
    requestCounter.current++;
    setSending(false);
    setInputText('');
    return () => {
      requestCounter.current++;
    };
  }, [selectedShopId]);

  const handleMarkedRead = useCallback((shopId: string) => {
    setShops((currentShops) =>
      currentShops.map((shop) =>
        shop.id === shopId ? { ...shop, unreadCount: 0 } : shop,
      ),
    );
  }, []);

  useEffect(() => {
    const becameVisible = !prevIsChatVisibleRef.current && isChatVisible;
    const sameSelectedShop = prevSelectedShopIdRef.current === selectedShopId;
    prevIsChatVisibleRef.current = isChatVisible;
    prevSelectedShopIdRef.current = selectedShopId;

    if (!becameVisible || !sameSelectedShop || !selectedShopId) return;
    const activeShop = shopsRef.current.find(
      (shop) => shop.id === selectedShopId,
    );
    if (!activeShop || activeShop.unreadCount <= 0) return;

    let active = true;
    const targetShopId = selectedShopId;
    void apiClient
      .patch(`/messages/conversations/${targetShopId}/read`)
      .then(() => {
        if (active) handleMarkedRead(targetShopId);
      })
      .catch((markReadError) => {
        console.error('Lỗi khi đánh dấu tin đã đọc:', markReadError);
      });

    return () => {
      active = false;
    };
  }, [isChatVisible, selectedShopId, handleMarkedRead]);

  const conversation = usePaginatedConversation({
    conversationId: selectedShopId,
    endpointBase: '/messages/conversations',
    onMarkedRead: handleMarkedRead,
  });

  const handleNewMessage = (message: DirectMessage) => {
    if (
      !user ||
      (message.senderId !== user.id && message.receiverId !== user.id)
    )
      return;
    const shopId =
      message.senderId === user.id ? message.receiverId : message.senderId;
    const isIncomingFromShop = message.senderId === shopId;
    const isUnreadIncoming = isIncomingFromShop && message.source !== 'AI';
    const isActiveShop = shopId === selectedShopIdRef.current;
    const isVisiblyActiveShop = isActiveShop && isChatVisibleRef.current;
    rememberInboxActivity(activityRef.current, shopId, message);
    setShops((current) =>
      orderInboxContacts(
        current.map((shop) =>
          isUnreadIncoming && !isVisiblyActiveShop && shop.id === shopId
            ? { ...shop, unreadCount: shop.unreadCount + 1 }
            : shop,
        ),
        activityRef.current,
      ),
    );
    if (!shopsRef.current.some((shop) => shop.id === shopId)) {
      void fetchShops();
    }
    if (isActiveShop) {
      conversation.appendMessages(message);
      if (isVisiblyActiveShop && isUnreadIncoming) {
        void apiClient
          .patch(`/messages/conversations/${shopId}/read`)
          .catch(() => {});
      }
    }
  };
  const socket = useInboxSocket(
    handleNewMessage,
    () => {
      void fetchShops(!selectedShopIdRef.current);
      void conversation.refreshLatest();
      void conversationMode.refresh();
    },
    (status) => {
      if (
        status.buyerId === user?.id &&
        status.sellerId === selectedShopIdRef.current
      )
        conversationMode.applyStatus(status);
    },
  );

  const handleSendMessage = async () => {
    const targetShopId = selectedShopId;
    const message = inputText.trim();
    if (!targetShopId || !message || sending) return;

    const requestId = ++sendRequestIdRef.current;
    setSending(true);
    conversation.setError('');
    try {
      const response = await apiClient.post<SendMessageResponse>(
        '/messages/conversations',
        { sellerId: targetShopId, message },
      );
      if (
        requestId !== sendRequestIdRef.current ||
        selectedShopIdRef.current !== targetShopId
      ) {
        return;
      }

      const { buyerMessage, aiMessage } = response.data;
      conversation.appendMessages(
        buyerMessage,
        ...(aiMessage ? [aiMessage] : []),
      );
      rememberInboxActivity(
        activityRef.current,
        targetShopId,
        aiMessage ?? buyerMessage,
      );
      setShops((current) => orderInboxContacts(current, activityRef.current));
      setInputText('');
      await conversationMode.refresh();
    } catch (requestError) {
      if (
        requestId !== sendRequestIdRef.current ||
        selectedShopIdRef.current !== targetShopId
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
    shops,
    selectedShopId,
    selectedShop: shops.find((shop) => shop.id === selectedShopId),
    loadingShops,
    inputText,
    sending,
    conversationMode,
    error:
      shopsError ||
      conversation.error ||
      conversationMode.error ||
      socket.error,
    setSelectedShopId,
    setInputText,
    handleSendMessage,
    conversation,
  };
};
