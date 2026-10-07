import { useCallback, useEffect, useRef, useState } from 'react';
import apiClient from '../api/client';
import type { ConversationMode } from '../components/inbox/types';

interface ModeState {
  endpoint: string | null;
  status: ConversationMode | null;
  loading: boolean;
  error: string;
}

export const useConversationMode = (endpoint: string | null) => {
  const [state, setState] = useState<ModeState>({
    endpoint: null,
    status: null,
    loading: false,
    error: '',
  });
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    if (!endpoint) {
      setState({ endpoint, status: null, loading: false, error: '' });
      return;
    }

    setState({ endpoint, status: null, loading: true, error: '' });
    try {
      const response = await apiClient.get<ConversationMode>(endpoint);
      if (requestId !== requestIdRef.current) return;
      setState({ endpoint, status: response.data, loading: false, error: '' });
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      console.error('Lỗi khi tải chế độ hội thoại:', error);
      setState({
        endpoint,
        status: null,
        loading: false,
        error: 'Không thể tải chế độ hội thoại. Hãy chọn lại cuộc trò chuyện.',
      });
    }
  }, [endpoint]);

  useEffect(() => {
    void refresh();
    return () => {
      // Bỏ phản hồi cũ khi đổi hội thoại hoặc unmount.
      requestIdRef.current++;
    };
  }, [refresh]);

  const applyStatus = (status: ConversationMode) => {
    requestIdRef.current++;
    setState({ endpoint, status, loading: false, error: '' });
  };

  const isCurrent = state.endpoint === endpoint;
  return {
    status: isCurrent ? state.status : null,
    loading: Boolean(endpoint) && (!isCurrent || state.loading),
    error: isCurrent ? state.error : '',
    refresh,
    applyStatus,
  };
};
