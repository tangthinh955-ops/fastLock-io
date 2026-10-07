import { useCallback, useEffect, useState } from 'react';
import apiClient from '../api/client';
import type {
  ChatMode,
  ConversationMode,
  DirectMessage,
  InboxContact,
} from '../components/inbox/types';
import { usePaginatedConversation } from './usePaginatedConversation';
import { useConversationMode } from './useConversationMode';

export const useSellerInbox = () => {
  const [customers, setCustomers] = useState<InboxContact[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customersError, setCustomersError] = useState('');
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [changingMode, setChangingMode] = useState(false);
  const modeEndpoint = selectedCustomerId
    ? `/messages/seller/conversations/${selectedCustomerId}/mode`
    : null;
  const conversationMode = useConversationMode(modeEndpoint);

  useEffect(() => {
    let active = true;

    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      setCustomersError('');
      try {
        const response = await apiClient.get<InboxContact[]>(
          '/messages/seller/customers',
        );
        if (!active) return;

        setCustomers(response.data);
        setSelectedCustomerId(response.data[0]?.id ?? null);
      } catch (requestError) {
        console.error('Lỗi khi tải danh sách khách hàng:', requestError);
        if (active) {
          setCustomersError('Không thể tải danh sách khách hàng.');
        }
      } finally {
        if (active) setLoadingCustomers(false);
      }
    };

    fetchCustomers();
    return () => {
      active = false;
    };
  }, []);

  const handleMarkedRead = useCallback((customerId: string) => {
    setCustomers((currentCustomers) =>
      currentCustomers.map((customer) =>
        customer.id === customerId ? { ...customer, unreadCount: 0 } : customer,
      ),
    );
  }, []);

  const conversation = usePaginatedConversation({
    conversationId: selectedCustomerId,
    endpointBase: '/messages/seller/conversations',
    onMarkedRead: handleMarkedRead,
  });

  const handleSendMessage = async () => {
    const message = inputText.trim();
    const buyerId = selectedCustomerId;
    if (!buyerId || !message || sending || changingMode) return;

    setSending(true);
    conversation.setError('');
    try {
      const response = await apiClient.post<DirectMessage>(
        '/messages/seller/conversations',
        { buyerId, message },
      );
      conversation.appendMessages(response.data);
      setInputText('');
      await conversationMode.refresh();
    } catch (requestError) {
      console.error('Lỗi khi gửi tin nhắn cho khách hàng:', requestError);
      conversation.setError('Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  const handleChangeMode = async (mode: ChatMode) => {
    if (!modeEndpoint || !conversationMode.status || sending || changingMode)
      return;
    setChangingMode(true);
    conversation.setError('');
    try {
      const response = await apiClient.patch<ConversationMode>(modeEndpoint, {
        mode,
      });
      conversationMode.applyStatus(response.data);
    } catch (error) {
      console.error('Lỗi khi đổi chế độ hội thoại:', error);
      conversation.setError('Không thể đổi chế độ. Vui lòng thử lại.');
    } finally {
      setChangingMode(false);
    }
  };

  return {
    customers,
    selectedCustomerId,
    selectedCustomer: customers.find(
      (customer) => customer.id === selectedCustomerId,
    ),
    loadingCustomers,
    inputText,
    sending,
    changingMode,
    conversationMode,
    handleChangeMode,
    error: customersError || conversation.error || conversationMode.error,
    setSelectedCustomerId,
    setInputText,
    handleSendMessage,
    conversation,
  };
};
