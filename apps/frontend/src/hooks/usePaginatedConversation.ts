import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import apiClient from '../api/client';
import {
  MESSAGE_PAGE_SIZE,
  type DirectMessage,
} from '../components/inbox/types';

interface UsePaginatedConversationOptions {
  conversationId: string | null;
  endpointBase: string;
  onMarkedRead: (conversationId: string) => void;
}

export const usePaginatedConversation = ({
  conversationId,
  endpointBase,
  onMarkedRead,
}: UsePaginatedConversationOptions) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousScrollHeightRef = useRef(0);
  const isPrependingRef = useRef(false);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setHasMore(false);
      return;
    }

    let active = true;

    const fetchConversation = async () => {
      setLoadingMessages(true);
      setError('');
      isPrependingRef.current = false;

      try {
        const response = await apiClient.get<DirectMessage[]>(
          `${endpointBase}/${conversationId}?limit=${MESSAGE_PAGE_SIZE}&skip=0`,
        );
        if (active) {
          setMessages(response.data);
          setHasMore(response.data.length === MESSAGE_PAGE_SIZE);
        }

        try {
          await apiClient.patch(`${endpointBase}/${conversationId}/read`);
          if (active) onMarkedRead(conversationId);
        } catch (markReadError) {
          console.error('Lỗi khi đánh dấu tin đã đọc:', markReadError);
        }
      } catch (requestError) {
        console.error('Lỗi khi tải cuộc trò chuyện:', requestError);
        if (active) setError('Không thể tải cuộc trò chuyện.');
      } finally {
        if (active) setLoadingMessages(false);
      }
    };

    fetchConversation();
    return () => {
      active = false;
    };
  }, [conversationId, endpointBase, onMarkedRead]);

  const loadMore = async () => {
    if (!conversationId || loadingMore || !hasMore) return;

    if (scrollContainerRef.current) {
      previousScrollHeightRef.current =
        scrollContainerRef.current.scrollHeight;
    }
    setLoadingMore(true);

    try {
      const response = await apiClient.get<DirectMessage[]>(
        `${endpointBase}/${conversationId}?limit=${MESSAGE_PAGE_SIZE}&skip=${messages.length}`,
      );
      if (response.data.length > 0) {
        isPrependingRef.current = true;
        setMessages((currentMessages) => [
          ...response.data,
          ...currentMessages,
        ]);
      }
      if (response.data.length < MESSAGE_PAGE_SIZE) setHasMore(false);
    } catch (requestError) {
      console.error('Lỗi khi tải thêm tin nhắn cũ:', requestError);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (
      container &&
      container.scrollTop <= 40 &&
      hasMore &&
      !loadingMore &&
      !loadingMessages
    ) {
      loadMore();
    }
  };

  useLayoutEffect(() => {
    if (isPrependingRef.current && scrollContainerRef.current) {
      const newScrollHeight = scrollContainerRef.current.scrollHeight;
      scrollContainerRef.current.scrollTop =
        newScrollHeight - previousScrollHeightRef.current;
      isPrependingRef.current = false;
      return;
    }

    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const appendMessages = (...newMessages: DirectMessage[]) => {
    setMessages((currentMessages) => [...currentMessages, ...newMessages]);
  };

  return {
    messages,
    loadingMessages,
    loadingMore,
    hasMore,
    error,
    chatEndRef,
    scrollContainerRef,
    loadMore,
    handleScroll,
    appendMessages,
    setError,
  };
};
