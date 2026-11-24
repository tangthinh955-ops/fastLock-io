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

interface UseSellerInboxOptions {
  autoSelectFirst?: boolean;
  isChatVisible?: boolean;
}

export const useSellerInbox = ({
  autoSelectFirst = true,
  isChatVisible = true,
}: UseSellerInboxOptions = {}) => {
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
  const sendRequestIdRef = useRef(0);
  const modeChangeRequestIdRef = useRef(0);
  const autoSelectFirstRef = useRef(autoSelectFirst);
  autoSelectFirstRef.current = autoSelectFirst;
  const isChatVisibleRef = useRef(isChatVisible);
  isChatVisibleRef.current = isChatVisible;
  const selectedCustomerIdRef = useRef<string | null>(selectedCustomerId);
  selectedCustomerIdRef.current = selectedCustomerId;
  const customersRef = useRef<InboxContact[]>(customers);
  customersRef.current = customers;
  const prevIsChatVisibleRef = useRef(isChatVisible);
  const prevSelectedCustomerIdRef = useRef<string | null>(selectedCustomerId);
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
      setSelectedCustomerId(
        (current) =>
          current ?? (autoSelectFirstRef.current ? (ordered[0]?.id ?? null) : null),
      );
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
    const requestCounter = contactsRequestRef;
    void fetchCustomers(true);
    return () => {
      requestCounter.current++;
    };
  }, [fetchCustomers]);

  useEffect(() => {
    if (autoSelectFirst && !selectedCustomerId && customers.length > 0) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [autoSelectFirst, selectedCustomerId, customers]);

  useEffect(() => {
    const sendCounter = sendRequestIdRef;
    const modeCounter = modeChangeRequestIdRef;
    sendCounter.current++;
    modeCounter.current++;
    setSending(false);
    setChangingMode(false);
    setInputText('');
    return () => {
      sendCounter.current++;
      modeCounter.current++;
    };
  }, [selectedCustomerId]);

  const handleMarkedRead = useCallback((customerId: string) => {
    setCustomers((currentCustomers) =>
      currentCustomers.map((customer) =>
        customer.id === customerId ? { ...customer, unreadCount: 0 } : customer,
      ),
    );
  }, []);

  useEffect(() => {
    const becameVisible = !prevIsChatVisibleRef.current && isChatVisible;
    const sameSelectedCustomer =
      prevSelectedCustomerIdRef.current === selectedCustomerId;
    prevIsChatVisibleRef.current = isChatVisible;
    prevSelectedCustomerIdRef.current = selectedCustomerId;

    if (!becameVisible || !sameSelectedCustomer || !selectedCustomerId) return;
    const activeCustomer = customersRef.current.find(
      (customer) => customer.id === selectedCustomerId,
    );
    if (!activeCustomer || activeCustomer.unreadCount <= 0) return;

    let active = true;
    const targetCustomerId = selectedCustomerId;
    void apiClient
      .patch(`/messages/seller/conversations/${targetCustomerId}/read`)
      .then(() => {
        if (active) handleMarkedRead(targetCustomerId);
      })
      .catch((markReadError) => {
        console.error('Lỗi khi đánh dấu tin đã đọc:', markReadError);
      });

    return () => {
      active = false;
    };
  }, [isChatVisible, selectedCustomerId, handleMarkedRead]);

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
    const isIncomingFromBuyer = message.senderId === buyerId;
    const isActiveCustomer = buyerId === selectedCustomerIdRef.current;
    const isVisiblyActiveCustomer = isActiveCustomer && isChatVisibleRef.current;
    rememberInboxActivity(activityRef.current, buyerId, message);
    setCustomers((current) => {
      const known = current.some((customer) => customer.id === buyerId);
      let entries = current;
      if (!known && isIncomingFromBuyer) {
        entries = [
          ...current,
          {
            id: buyerId,
            name: message.sender.name,
            unreadCount: isVisiblyActiveCustomer ? 0 : 1,
          },
        ];
      } else if (known && isIncomingFromBuyer && !isVisiblyActiveCustomer) {
        entries = current.map((customer) =>
          customer.id === buyerId
            ? { ...customer, unreadCount: customer.unreadCount + 1 }
            : customer,
        );
      }
      return orderInboxContacts(entries, activityRef.current);
    });
    if (!customersRef.current.some((customer) => customer.id === buyerId)) {
      void fetchCustomers();
    }
    if (isActiveCustomer) {
      conversation.appendMessages(message);
      if (isVisiblyActiveCustomer && isIncomingFromBuyer) {
        void apiClient
          .patch(`/messages/seller/conversations/${buyerId}/read`)
          .catch(() => {});
      }
    }
  };
  const socket = useInboxSocket(
    handleNewMessage,
    () => {
      void fetchCustomers();
      void conversation.refreshLatest();
      void conversationMode.refresh();
    },
    (status) => {
      if (
        status.sellerId === user?.id &&
        status.buyerId === selectedCustomerIdRef.current
      )
        conversationMode.applyStatus(status);
    },
  );

  const handleSendMessage = async () => {
    const message = inputText.trim();
    const buyerId = selectedCustomerId;
    if (!buyerId || !message || sending || changingMode) return;

    const requestId = ++sendRequestIdRef.current;
    setSending(true);
    conversation.setError('');
    try {
      const response = await apiClient.post<DirectMessage>(
        '/messages/seller/conversations',
        { buyerId, message },
      );
      if (
        requestId !== sendRequestIdRef.current ||
        selectedCustomerIdRef.current !== buyerId
      ) {
        return;
      }

      conversation.appendMessages(response.data);
      rememberInboxActivity(activityRef.current, buyerId, response.data);
      setCustomers((current) =>
        orderInboxContacts(current, activityRef.current),
      );
      setInputText('');
      await conversationMode.refresh();
    } catch (requestError) {
      if (
        requestId !== sendRequestIdRef.current ||
        selectedCustomerIdRef.current !== buyerId
      ) {
        return;
      }
      console.error('Lỗi khi gửi tin nhắn cho khách hàng:', requestError);
      conversation.setError('Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      if (requestId === sendRequestIdRef.current) {
        setSending(false);
      }
    }
  };

  const handleChangeMode = async (mode: ChatMode) => {
    const buyerId = selectedCustomerId;
    if (
      !buyerId ||
      !modeEndpoint ||
      !conversationMode.status ||
      sending ||
      changingMode
    )
      return;
    const requestId = ++modeChangeRequestIdRef.current;
    setChangingMode(true);
    conversation.setError('');
    try {
      const response = await apiClient.patch<ConversationMode>(modeEndpoint, {
        mode,
      });
      if (
        requestId !== modeChangeRequestIdRef.current ||
        selectedCustomerIdRef.current !== buyerId
      ) {
        return;
      }
      conversationMode.applyStatus(response.data);
    } catch (error) {
      if (
        requestId !== modeChangeRequestIdRef.current ||
        selectedCustomerIdRef.current !== buyerId
      ) {
        return;
      }
      console.error('Lỗi khi đổi chế độ hội thoại:', error);
      conversation.setError('Không thể đổi chế độ. Vui lòng thử lại.');
    } finally {
      if (requestId === modeChangeRequestIdRef.current) {
        setChangingMode(false);
      }
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
