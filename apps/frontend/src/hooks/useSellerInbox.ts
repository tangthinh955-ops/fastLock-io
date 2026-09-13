import { useCallback, useEffect, useState } from 'react';
import apiClient from '../api/client';
import type {
  DirectMessage,
  InboxContact,
} from '../components/inbox/types';
import { usePaginatedConversation } from './usePaginatedConversation';

export const useSellerInbox = () => {
  const [customers, setCustomers] = useState<InboxContact[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customersError, setCustomersError] = useState('');
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

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
        customer.id === customerId
          ? { ...customer, unreadCount: 0 }
          : customer,
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
    if (!buyerId || !message || sending) return;

    setSending(true);
    conversation.setError('');
    try {
      const response = await apiClient.post<DirectMessage>(
        '/messages/seller/conversations',
        { buyerId, message },
      );
      conversation.appendMessages(response.data);
      setInputText('');
    } catch (requestError) {
      console.error('Lỗi khi gửi tin nhắn cho khách hàng:', requestError);
      conversation.setError('Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setSending(false);
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
    error: customersError || conversation.error,
    setSelectedCustomerId,
    setInputText,
    handleSendMessage,
    conversation,
  };
};
