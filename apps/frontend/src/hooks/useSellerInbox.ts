import { useCallback, useEffect, useRef, useState } from 'react';
import apiClient from '../api/client';
import type {
  ChatMode,
  ConversationMode,
  DirectMessage,
  InboxContact,
} from '../components/inbox/types';
import { usePaginatedConversation } from './usePaginatedConversation';
import { useConversationMode } from './useConversationMode';
import { useAuth } from '../context/AuthContext';
import { useInboxSocket } from './useInboxSocket';
import {
  orderInboxContacts,
  rememberInboxActivity,
} from '../utils/inboxMessages';

export const useSellerInbox = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<InboxContact[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customersError, setCustomersError] = useState('');
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [changingMode, setChangingMode] = useState(false);
  const activityRef = useRef(
    new Map<string, Pick<DirectMessage, 'id' | 'createdAt'>>(),
  );
  const contactsRequestRef = useRef(0);
  const modeEndpoint = selectedCustomerId
    ? `/messages/seller/conversations/${selectedCustomerId}/mode`
    : null;
  const conversationMode = useConversationMode(modeEndpoint);

  const fetchCustomers = useCallback(async (initial = false) => {
    const request = ++contactsRequestRef.current;
    if (initial) setLoadingCustomers(true);
    setCustomersError('');
    try {
      const response = await apiClient.get<InboxContact[]>(
        '/messages/seller/customers',
      );
      if (request !== contactsRequestRef.current) return;

      const ordered = orderInboxContacts(response.data, activityRef.current);
      setCustomers((current) =>
        orderInboxContacts(
          [
            ...ordered,
            ...current.filter(
              (customer) =>
                activityRef.current.has(customer.id) &&
                !ordered.some((entry) => entry.id === customer.id),
            ),
          ],
          activityRef.current,
        ),
      );
      setSelectedCustomerId((current) => current ?? ordered[0]?.id ?? null);
    } catch (requestError) {
      console.error('Lỗi khi tải danh sách khách hàng:', requestError);
      if (request === contactsRequestRef.current) {
        setCustomersError('Không thể tải danh sách khách hàng.');
      }
    } finally {
      if (request === contactsRequestRef.current) setLoadingCustomers(false);
    }
  }, []);

  useEffect(() => {
    void fetchCustomers(true);
    return () => {
      contactsRequestRef.current++;
    };
  }, [fetchCustomers]);

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

  const handleNewMessage = (message: DirectMessage) => {
    if (
      !user ||
      (message.senderId !== user.id && message.receiverId !== user.id)
    )
      return;
    const buyerId =
      message.senderId === user.id ? message.receiverId : message.senderId;
    rememberInboxActivity(activityRef.current, buyerId, message);
    setCustomers((current) => {
      const known = current.some((customer) => customer.id === buyerId);
      const entries =
        !known && message.senderId === buyerId
          ? [
              ...current,
              { id: buyerId, name: message.sender.name, unreadCount: 0 },
            ]
          : current;
      return orderInboxContacts(entries, activityRef.current);
    });
    if (!customers.some((customer) => customer.id === buyerId))
      void fetchCustomers();
    if (buyerId === selectedCustomerId) conversation.appendMessages(message);
  };
  const socket = useInboxSocket(
    handleNewMessage,
    () => {
      void fetchCustomers();
      void conversation.refreshLatest();
      void conversationMode.refresh();
    },
    (status) => {
      if (status.sellerId === user?.id && status.buyerId === selectedCustomerId)
        conversationMode.applyStatus(status);
    },
  );

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
      rememberInboxActivity(activityRef.current, buyerId, response.data);
      setCustomers((current) =>
        orderInboxContacts(current, activityRef.current),
      );
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
    error:
      customersError ||
      conversation.error ||
      conversationMode.error ||
      socket.error,
    setSelectedCustomerId,
    setInputText,
    handleSendMessage,
    conversation,
  };
};
