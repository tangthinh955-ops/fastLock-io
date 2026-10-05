import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import apiClient from '../api/client';

const SOCKET_URL = 'http://localhost:3001';
const COMMENT_HISTORY_LIMIT = 10;

export interface ActiveLivestream {
  id: string;
  title: string;
  sellerId: string;
  seller: {
    id: string;
    name: string;
  };
}

export interface LivestreamComment {
  id: string;
  buyerName: string;
  content: string;
  isOrder?: boolean;
  sku?: string;
  orderSuccess?: boolean;
  createdAt: string;
}

interface UseViewerLivestreamOptions {
  buyerId?: string;
  buyerName?: string;
  token?: string | null;
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

export const useViewerLivestream = ({
  buyerId,
  buyerName,
  token,
}: UseViewerLivestreamOptions) => {
  const [activeStream, setActiveStream] = useState<ActiveLivestream | null>(
    null,
  );
  const [comments, setComments] = useState<LivestreamComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [roomJoined, setRoomJoined] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const activeStreamRef = useRef<ActiveLivestream | null>(null);

  const selectActiveStream = useCallback((stream: ActiveLivestream | null) => {
    setActiveStream((currentStream) =>
      currentStream?.id === stream?.id ? currentStream : stream,
    );
  }, []);

  const loadActiveStream = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get<ActiveLivestream[]>(
        '/livestreams/active',
      );
      selectActiveStream(response.data[0] ?? null);
    } catch (requestError) {
      console.error('Lỗi khi tải livestream đang phát:', requestError);
      setError('Không thể tải thông tin livestream.');
    } finally {
      setLoading(false);
    }
  }, [selectActiveStream]);

  useEffect(() => {
    void loadActiveStream();
  }, [loadActiveStream]);

  useEffect(() => {
    activeStreamRef.current = activeStream;
    setRoomJoined(false);

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
      (data: { livestreamId?: string; status?: string }) => {
        if (
          data.status === 'SUCCESS' &&
          data.livestreamId === activeStreamRef.current?.id
        ) {
          setRoomJoined(true);
        }
      },
    );

    socket.on('stream_started', (stream: ActiveLivestream) => {
      setError('');
      selectActiveStream(stream);
    });

    socket.on('stream_ended', (data: { livestreamId?: string }) => {
      if (data.livestreamId !== activeStreamRef.current?.id) return;

      setRoomJoined(false);
      setError('Phiên livestream đã kết thúc.');
      selectActiveStream(null);
    });

    socket.on('comment_received', (comment: LivestreamComment) => {
      const livestreamId = activeStreamRef.current?.id;
      if (!livestreamId) return;

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

  return {
    activeStream,
    comments,
    loading,
    connected: socketConnected && roomJoined,
    error,
    loadActiveStream,
    sendComment,
  };
};
