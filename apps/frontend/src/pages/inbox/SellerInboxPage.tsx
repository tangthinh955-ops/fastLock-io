import React, { useState } from 'react';
import { Button, useMediaQuery, useTheme } from '@mui/material';
import { ChatHeader } from '../../components/inbox/ChatHeader';
import { ChatInputBar } from '../../components/inbox/ChatInputBar';
import { CustomerSidebar } from '../../components/inbox/CustomerSidebar';
import {
  InboxSplitLayout,
  getConversationModeDisplay,
} from '../../components/inbox/InboxSplitLayout';
import { MessageList } from '../../components/inbox/MessageList';
import { useAuth } from '../../context/AuthContext';
import { useSellerInbox } from '../../hooks/useSellerInbox';

export const SellerInboxPage: React.FC = () => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const { user } = useAuth();
  const [mobilePane, setMobilePane] = useState<'list' | 'chat'>('list');
  const inbox = useSellerInbox({ autoSelectFirst: isDesktop });
  const { conversation } = inbox;
  const { status, loading: loadingMode } = inbox.conversationMode;
  const { isAiMode, modeLabel } = getConversationModeDisplay(status, loadingMode);

  const handleSelectCustomer = (customerId: string) => {
    inbox.setSelectedCustomerId(customerId);
    setMobilePane('chat');
    requestAnimationFrame(() => {
      conversation.chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
    });
  };

  const handleBackToList = () => {
    setMobilePane('list');
    if (!isDesktop) {
      inbox.setSelectedCustomerId(null);
    }
  };

  return (
    <InboxSplitLayout
      headerTitle="Tin nhắn khách hàng"
      headerDescription="Xem lịch sử tư vấn, tiếp quản khách hoặc bật lại trợ lý AI."
      mobilePane={mobilePane}
      hasError={Boolean(inbox.error)}
      emptyMessage={inbox.error || 'Chọn một khách hàng để xem lịch sử trò chuyện.'}
      sidebar={
        <CustomerSidebar
          customers={inbox.customers}
          selectedCustomerId={inbox.selectedCustomerId}
          loading={inbox.loadingCustomers}
          disabled={inbox.sending || inbox.changingMode}
          onSelect={handleSelectCustomer}
        />
      }
      chatContent={
        inbox.selectedCustomer ? (
          <>
            <ChatHeader
              name={inbox.selectedCustomer.name}
              statusText={modeLabel}
              isAiMode={isAiMode}
              onBack={handleBackToList}
              actions={
                <Button
                  variant={status?.mode === 'HUMAN' ? 'contained' : 'outlined'}
                  size="small"
                  color="primary"
                  disabled={
                    !status ||
                    loadingMode ||
                    inbox.sending ||
                    inbox.changingMode
                  }
                  onClick={() =>
                    inbox.handleChangeMode(
                      status?.mode === 'AI' ? 'HUMAN' : 'AI',
                    )
                  }
                >
                  {inbox.changingMode
                    ? 'Đang cập nhật...'
                    : status?.mode === 'HUMAN'
                      ? 'Bật lại AI'
                      : 'Tiếp quản'}
                </Button>
              }
            />
            <MessageList
              messages={conversation.messages}
              currentUserId={user?.id}
              view="seller"
              loading={conversation.loadingMessages}
              loadingMore={conversation.loadingMore}
              hasMore={conversation.hasMore}
              error={inbox.error}
              scrollContainerRef={conversation.scrollContainerRef}
              chatEndRef={conversation.chatEndRef}
              onScroll={conversation.handleScroll}
              onLoadMore={conversation.loadMore}
            />
            <ChatInputBar
              value={inbox.inputText}
              sending={inbox.sending || inbox.changingMode}
              view="seller"
              onChange={inbox.setInputText}
              onSend={inbox.handleSendMessage}
            />
          </>
        ) : null
      }
    />
  );
};

export default SellerInboxPage;
