import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import apiClient from '../api/client';
import { SOCKET_URL } from '../config/env';
import type { DraftOrderData } from '../components/viewer/OrderConfirmModal';

const COMMENT_HISTORY_LIMIT = 10;

export interface ActiveLivestream {
  id: string;
  title: string;
  description?: string | null;
  sellerId: string;
  startedAt?: string;
  seller: {
    id: string;
    name: string;
  };
}

export interface ShopLiveItem {
  id: string;
  name: string;
  email: string;
  productCount: number;
  isLive: boolean;
  activeStream: ActiveLivestream | null;
  kbHighlights?: Array<{ id: string; keyword: string; answer: string }>;
}

export interface LivestreamComment {
  id: string;
  livestreamId?: string;
  buyerId?: string;
  buyerName: string;
  content: string;
  isOrder?: boolean;
  sku?: string;
  orderSuccess?: boolean;
  outOfStock?: boolean;
  createdAt: string;
}

interface UseViewerLivestreamOptions {
  buyerId?: string;
  buyerName?: string;
  token?: string | null;
  selectedSellerId?: string | null;
}

const getHistoryKey = (livestreamId: string) =>
  `livestream_comments_${livestreamId}`;

const readCommentHistory = (livestreamId: string): LivestreamComment[] => {
  const historyKey = getHistoryKey(livestreamId);
  try {
    const savedComments = JSON.parse(sessionStorage.getItem(historyKey) || '[]');
    return Array.isArray(savedComments)
      ? savedComments.slice(-COMMENT_HISTORY_LIMIT)
      : [];
  } catch {
    sessionStorage.removeItem(historyKey);
    return [];
  }
};

const sortShops = (items: ShopLiveItem[]): ShopLiveItem[] =>
  [...items].sort((a, b) => {
    if (a.isLive !== b.isLive) {
      return a.isLive ? -1 : 1;
    }
    if (a.isLive && b.isLive) {
      const timeA = a.activeStream?.startedAt
        ? new Date(a.activeStream.startedAt).getTime()
        : 0;
      const timeB = b.activeStream?.startedAt
        ? new Date(b.activeStream.startedAt).getTime()
        : 0;
      if (timeA !== timeB) {
        return timeB - timeA;
      }
    }
    return a.name.localeCompare(b.name, 'vi');
  });

export const useViewerLivestream = ({
  buyerId,
  buyerName,
  token,
  selectedSellerId = null,
}: UseViewerLivestreamOptions) => {
  const [shops, setShops] = useState<ShopLiveItem[]>([]);
  const [activeStream, setActiveStream] = useState<ActiveLivestream | null>(
    null,
  );
  const [comments, setComments] = useState<LivestreamComment[]>([]);
  const [draftOrder, setDraftOrder] = useState<DraftOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [roomJoined, setRoomJoined] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [error, setError] = useState('');
  const buyerIdRef = useRef(buyerId);
  buyerIdRef.current = buyerId;
  const socketRef = useRef<Socket | null>(null);
  const activeStreamRef = useRef<ActiveLivestream | null>(null);
  const selectedSellerIdRef = useRef<string | null>(selectedSellerId ?? null);
  const prevSelectedSellerIdRef = useRef<string | null>(selectedSellerId ?? null);
  const shopsRef = useRef<ShopLiveItem[]>([]);
  const loadRequestIdRef = useRef(0);
  selectedSellerIdRef.current = selectedSellerId ?? null;
  shopsRef.current = shops;

  const selectActiveStream = useCallback((stream: ActiveLivestream | null) => {
    setActiveStream((currentStream) =>
      currentStream?.id === stream?.id ? currentStream : stream,
    );
  }, []);

  const loadActiveStream = useCallback(async () => {
    const requestId = ++loadRequestIdRef.current;
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get<ShopLiveItem[]>(
        '/livestreams/shops',
      );
      if (requestId !== loadRequestIdRef.current) return;
      const sortedShops = sortShops(response.data);
      shopsRef.current = sortedShops;
      setShops(sortedShops);

      const currentSellerId = selectedSellerIdRef.current;
      if (currentSellerId) {
        const matchedShop = sortedShops.find(
          (shop) => shop.id === currentSellerId,
        );
        selectActiveStream(matchedShop?.activeStream ?? null);
      } else {
        selectActiveStream(null);
      }
    } catch (requestError) {
      if (requestId !== loadRequestIdRef.current) return;
      console.error('Lỗi khi tải danh sách phòng livestream:', requestError);
      setError('Không thể tải thông tin livestream.');
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [selectActiveStream]);

  useEffect(() => {
    void loadActiveStream();
  }, [loadActiveStream]);

  useEffect(() => {
    const previousSellerId = prevSelectedSellerIdRef.current;
    const nextSellerId = selectedSellerId ?? null;
    prevSelectedSellerIdRef.current = nextSellerId;
    selectedSellerIdRef.current = nextSellerId;

    setError('');
    setComments([]);

    if (!nextSellerId) {
      selectActiveStream(null);
      if (previousSellerId) {
        void loadActiveStream();
      }
      return;
    }

    const matchedShop = shopsRef.current.find(
      (shop) => shop.id === nextSellerId,
    );
    selectActiveStream(matchedShop?.activeStream ?? null);
  }, [loadActiveStream, selectActiveStream, selectedSellerId]);

  useEffect(() => {
    activeStreamRef.current = activeStream;
    setRoomJoined(false);
    setViewerCount(0);

    if (!activeStream) return;

    setComments(readCommentHistory(activeStream.id));
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('join_room', { livestreamId: activeStream.id });
    }

    return () => {
      socketRef.current?.emit('leave_room', {
        livestreamId: activeStream.id,
      });
    };
  }, [activeStream]);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      setError('');

      const currentStream = activeStreamRef.current;
      if (currentStream) {
        socket.emit('join_room', { livestreamId: currentStream.id });
      }
    });

    socket.on(
      'room_joined',
      (data: { livestreamId?: string; status?: string; viewerCount?: number }) => {
        if (
          data.status === 'SUCCESS' &&
          data.livestreamId === activeStreamRef.current?.id
        ) {
          setRoomJoined(true);
          if (typeof data.viewerCount === 'number') {
            setViewerCount(data.viewerCount);
          }
        }
      },
    );

    socket.on(
      'viewer_count',
      (data: { livestreamId?: string; viewerCount?: number }) => {
        if (
          data.livestreamId === activeStreamRef.current?.id &&
          typeof data.viewerCount === 'number'
        ) {
          setViewerCount(data.viewerCount);
        }
      },
    );

    socket.on('stream_started', (stream: ActiveLivestream) => {
      const streamWithTimestamp: ActiveLivestream = {
        ...stream,
        startedAt: stream.startedAt ?? new Date().toISOString(),
      };

      setShops((currentShops) => {
        const exists = currentShops.some((shop) => shop.id === stream.sellerId);
        const nextShops = exists
          ? currentShops.map((shop) =>
              shop.id === stream.sellerId
                ? { ...shop, isLive: true, activeStream: streamWithTimestamp }
                : shop,
            )
          : [
              ...currentShops,
              {
                id: stream.sellerId,
                name: stream.seller?.name || 'Cửa hàng',
                email: '',
                productCount: 0,
                isLive: true,
                activeStream: streamWithTimestamp,
                kbHighlights: [],
              },
            ];
        return sortShops(nextShops);
      });

      if (selectedSellerIdRef.current === stream.sellerId) {
        setError('');
        selectActiveStream(streamWithTimestamp);
      }
    });

    socket.on('stream_ended', (data: { livestreamId?: string }) => {
      if (data.livestreamId) {
        setShops((currentShops) =>
          sortShops(
            currentShops.map((shop) =>
              shop.activeStream?.id === data.livestreamId
                ? { ...shop, isLive: false, activeStream: null }
                : shop,
            ),
          ),
        );
      }

      if (
        !data.livestreamId ||
        data.livestreamId !== activeStreamRef.current?.id
      ) {
        return;
      }

      setRoomJoined(false);
      setViewerCount(0);
      setError('Phiên livestream đã kết thúc.');
      selectActiveStream(null);
    });

    socket.on('comment_received', (comment: LivestreamComment) => {
      const livestreamId = activeStreamRef.current?.id;
      if (!livestreamId) return;
      if (comment.livestreamId && comment.livestreamId !== livestreamId) return;

      setComments((currentComments) => {
        const nextComments = [...currentComments, comment].slice(
          -COMMENT_HISTORY_LIMIT,
        );
        sessionStorage.setItem(
          getHistoryKey(livestreamId),
          JSON.stringify(nextComments),
        );
        return nextComments;
      });
    });

    socket.on('draft_order_ready', (data: DraftOrderData) => {
      if (data.buyerId && data.buyerId === buyerIdRef.current) {
        setDraftOrder(data);
      }
    });

    socket.on('order_failed', (data: { buyerId?: string; message?: string }) => {
      if (!data.buyerId || data.buyerId === buyerIdRef.current) {
        setError(data.message || 'Sản phẩm hiện đã hết hàng.');
      }
    });

    socket.on('comment_error', (data: { message?: string }) => {
      setError(data.message || 'Không thể gửi bình luận.');
    });

    socket.on('connect_error', () => {
      setSocketConnected(false);
      setRoomJoined(false);
      setError('Không thể kết nối bình luận trực tiếp.');
    });

    socket.on('auth_error', (data: { message?: string }) => {
      setSocketConnected(false);
      setRoomJoined(false);
      setError(data.message || 'Phiên đăng nhập Socket không hợp lệ.');
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
      setRoomJoined(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
      setRoomJoined(false);
    };
  }, [selectActiveStream, token]);

  const sendComment = useCallback(
    (commentText: string) => {
      if (
        !socketRef.current ||
        !activeStream ||
        !buyerId ||
        !socketConnected ||
        !roomJoined
      ) {
        return false;
      }

      socketRef.current.emit('send_comment', {
        livestreamId: activeStream.id,
        buyerId,
        buyerName: buyerName || 'Khách hàng',
        commentText,
      });
      return true;
    },
    [activeStream, buyerId, buyerName, roomJoined, socketConnected],
  );

  const selectedShop = shops.find((s) => s.id === selectedSellerId) ?? null;

  return {
    shops,
    selectedShop,
    activeStream,
    comments,
    draftOrder,
    setDraftOrder,
    loading,
    connected: socketConnected && roomJoined,
    viewerCount,
    error,
    loadActiveStream,
    sendComment,
  };
};
