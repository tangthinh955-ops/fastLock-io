import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import type {
  ConversationModeEvent,
  DirectMessage,
} from '../components/inbox/types';

export const useInboxSocket = (
  onMessage: (message: DirectMessage) => void,
  onFirstReady: () => void,
  onModeChanged: (status: ConversationModeEvent) => void,
) => {
  const { token, user } = useAuth();
  const userId = user?.id;
  const messageHandlerRef = useRef(onMessage);
  const readyHandlerRef = useRef(onFirstReady);
  const modeHandlerRef = useRef(onModeChanged);
  const [error, setError] = useState('');

  useEffect(() => {
    messageHandlerRef.current = onMessage;
    readyHandlerRef.current = onFirstReady;
    modeHandlerRef.current = onModeChanged;
  }, [onMessage, onFirstReady, onModeChanged]);

  useEffect(() => {
    if (!token || !userId) return;
    let active = true;
    const seen = new Set<string>();
    let firstReady = true;
    const baseURL = apiClient.defaults.baseURL ?? window.location.origin;
    const socket = io(`${baseURL.replace(/\/$/, '')}/inbox`, {
      autoConnect: false,
      auth: { token },
    });
    const handleMessage = (message: DirectMessage) => {
      if (
        !active ||
        !message?.id ||
        seen.has(message.id) ||
        (message.senderId !== userId && message.receiverId !== userId)
      )
        return;
      seen.add(message.id);
      messageHandlerRef.current(message);
    };
    const handleReady = () => {
      if (!active) return;
      setError('');
      if (firstReady) {
        firstReady = false;
        readyHandlerRef.current();
      }
    };
    const handleModeChanged = (status: ConversationModeEvent) => {
      if (
        !active ||
        !status ||
        (status.buyerId !== userId && status.sellerId !== userId) ||
        (status.mode !== 'AI' && status.mode !== 'HUMAN') ||
        !Number.isInteger(status.version) ||
        status.version < 0
      )
        return;
      modeHandlerRef.current(status);
    };
    const handleError = () => {
      if (active)
        setError(
          'Chưa kết nối được Inbox realtime. Bạn vẫn có thể gửi tin và tải lại lịch sử.',
        );
    };
    const handleDisconnect = (reason: string) => {
      if (reason !== 'io client disconnect') handleError();
    };
    socket.on('new_message', handleMessage);
    socket.on('conversation_mode_changed', handleModeChanged);
    socket.on('inbox_ready', handleReady);
    socket.on('connect_error', handleError);
    socket.on('disconnect', handleDisconnect);
    socket.connect();
    return () => {
      active = false;
      socket.off('new_message', handleMessage);
      socket.off('conversation_mode_changed', handleModeChanged);
      socket.off('inbox_ready', handleReady);
      socket.off('connect_error', handleError);
      socket.off('disconnect', handleDisconnect);
      socket.disconnect();
    };
  }, [token, userId]);

  return { error };
};
