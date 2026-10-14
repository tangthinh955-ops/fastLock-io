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
  const endpointRef = useRef(endpoint);
  endpointRef.current = endpoint;

  const refresh = useCallback(async () => {
    if (endpointRef.current !== endpoint) return;
    const requestId = ++requestIdRef.current;
    if (!endpoint) {
      setState({ endpoint, status: null, loading: false, error: '' });
      return;
    }

    setState((current) => ({
      endpoint,
      status: current.endpoint === endpoint ? current.status : null,
      loading: true,
      error: '',
    }));
    try {
      const response = await apiClient.get<ConversationMode>(endpoint);
      if (
        requestId !== requestIdRef.current ||
        endpointRef.current !== endpoint
      )
        return;
      setState((current) => ({
        endpoint,
        status:
          current.endpoint === endpoint &&
          current.status &&
          current.status.version > response.data.version
            ? current.status
            : response.data,
        loading: false,
        error: '',
      }));
    } catch (error) {
      if (
        requestId !== requestIdRef.current ||
        endpointRef.current !== endpoint
      )
        return;
      console.error('Lỗi khi tải chế độ hội thoại:', error);
      setState((current) => ({
        endpoint,
        status: current.endpoint === endpoint ? current.status : null,
        loading: false,
        error: 'Không thể tải chế độ hội thoại. Hãy chọn lại cuộc trò chuyện.',
      }));
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
    // Callback HTTP của hội thoại cũ không được cập nhật hội thoại đang chọn.
    if (!endpoint || endpointRef.current !== endpoint) return;
    requestIdRef.current++;
    setState((current) => ({
      endpoint,
      status:
        current.endpoint === endpoint &&
        current.status &&
        current.status.version > status.version
          ? current.status
          : status,
      loading: false,
      error: '',
    }));
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
