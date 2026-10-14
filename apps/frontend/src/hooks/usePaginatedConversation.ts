import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import apiClient from '../api/client';
import { mergeInboxMessages } from '../utils/inboxMessages';
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
  const key = `${endpointBase}/${conversationId ?? ''}`;
  const [messageState, setMessageState] = useState<{
    key: string;
    messages: DirectMessage[];
  }>({ key: '', messages: [] });
  const messages = messageState.key === key ? messageState.messages : [];
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousScrollHeightRef = useRef(0);
  const isPrependingRef = useRef(false);
  const previousScrollTopRef = useRef(0);
  const followLatestRef = useRef(true);
  const generationRef = useRef(0);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    const generation = ++generationRef.current;
    loadingMoreRef.current = false;
    setLoadingMore(false);
    setMessageState((current) =>
      current.key === key ? current : { key, messages: [] },
    );
    followLatestRef.current = true;
    if (!conversationId) {
      setHasMore(false);
      setLoadingMessages(false);
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
          setMessageState((current) =>
            current.key === key
              ? {
                  key,
                  messages: mergeInboxMessages(current.messages, response.data),
                }
              : current,
          );
          setHasMore(response.data.length === MESSAGE_PAGE_SIZE);
        }

        if (!active) return;
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
      if (generationRef.current === generation) generationRef.current++;
    };
  }, [conversationId, endpointBase, key, onMarkedRead]);

  const loadMore = async () => {
    if (
      !conversationId ||
      loadingMoreRef.current ||
      loadingMessages ||
      !hasMore
    )
      return;
    const generation = generationRef.current;
    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const response = await apiClient.get<DirectMessage[]>(
        `${endpointBase}/${conversationId}?limit=${MESSAGE_PAGE_SIZE}&skip=${messages.length}`,
      );
      if (generation !== generationRef.current) return;
      if (response.data.length > 0) {
        const existingIds = new Set(messages.map((message) => message.id));
        const hasOlderMessages = response.data.some(
          (message) => !existingIds.has(message.id),
        );
        if (hasOlderMessages && scrollContainerRef.current) {
          previousScrollHeightRef.current =
            scrollContainerRef.current.scrollHeight;
          previousScrollTopRef.current = scrollContainerRef.current.scrollTop;
          isPrependingRef.current = true;
        }
        setMessageState((current) =>
          current.key === key
            ? {
                key,
                messages: mergeInboxMessages(current.messages, response.data),
              }
            : current,
        );
      }
      if (response.data.length < MESSAGE_PAGE_SIZE) setHasMore(false);
    } catch (requestError) {
      if (generation === generationRef.current)
        console.error('Lỗi khi tải thêm tin nhắn cũ:', requestError);
    } finally {
      if (generation === generationRef.current) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container)
      followLatestRef.current =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        80;
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
        previousScrollTopRef.current +
        newScrollHeight -
        previousScrollHeightRef.current;
      isPrependingRef.current = false;
      return;
    }

    if (followLatestRef.current)
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const appendMessages = (...newMessages: DirectMessage[]) => {
    setMessageState((current) =>
      current.key === key
        ? { key, messages: mergeInboxMessages(current.messages, newMessages) }
        : current,
    );
  };

  const refreshLatest = async () => {
    if (!conversationId) return;
    const generation = generationRef.current;
    try {
      const response = await apiClient.get<DirectMessage[]>(
        `${endpointBase}/${conversationId}?limit=${MESSAGE_PAGE_SIZE}&skip=0`,
      );
      if (generation !== generationRef.current) return;
      appendMessages(...response.data);
    } catch (requestError) {
      if (generation === generationRef.current)
        console.error('Lỗi khi đồng bộ tin lúc kết nối Inbox:', requestError);
    }
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
    refreshLatest,
    setError,
  };
};
