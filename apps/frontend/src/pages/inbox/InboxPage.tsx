import React, { useState } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { ChatHeader } from '../../components/inbox/ChatHeader';
import { ChatInputBar } from '../../components/inbox/ChatInputBar';
import {
  InboxSplitLayout,
  getConversationModeDisplay,
} from '../../components/inbox/InboxSplitLayout';
import { MessageList } from '../../components/inbox/MessageList';
import { ShopSidebar } from '../../components/inbox/ShopSidebar';
import { useAuth } from '../../context/AuthContext';
import { useBuyerInbox } from '../../hooks/useBuyerInbox';

export const InboxPage: React.FC = () => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobilePane, setMobilePane] = useState<'list' | 'chat'>(() =>
    searchParams.get('sellerId') ? 'chat' : 'list',
  );
  const inbox = useBuyerInbox({ autoSelectFirst: isDesktop });
  const { conversation } = inbox;
  const { status, loading: loadingMode } = inbox.conversationMode;
  const { isAiMode, modeLabel } = getConversationModeDisplay(status, loadingMode);

  const handleSelectShop = (shopId: string) => {
    inbox.setSelectedShopId(shopId);
    setSearchParams({ sellerId: shopId }, { replace: true });
    setMobilePane('chat');
    requestAnimationFrame(() => {
      conversation.chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
    });
  };

  const handleBackToList = () => {
    setMobilePane('list');
    setSearchParams({}, { replace: true });
    if (!isDesktop) {
      inbox.setSelectedShopId(null);
    }
  };

  return (
    <InboxSplitLayout
      headerTitle="Hộp thư Trao đổi & Đơn hàng"
      headerDescription="Xem nội dung tư vấn sản phẩm và mã thanh toán VietQR từ các Shop"
      mobilePane={mobilePane}
      hasError={Boolean(inbox.error)}
      emptyMessage={inbox.error || 'Chọn một kênh để xem nội dung trao đổi.'}
      sidebar={
        <ShopSidebar
          shops={inbox.shops}
          selectedShopId={inbox.selectedShopId}
          loading={inbox.loadingShops}
          disabled={inbox.sending}
          onSelect={handleSelectShop}
        />
      }
      chatContent={
        inbox.selectedShop ? (
          <>
            <ChatHeader
              name={inbox.selectedShop.name}
              statusText={modeLabel}
              isAiMode={isAiMode}
              badgeLabel="Kênh chính thức"
              onBack={handleBackToList}
            />
            <MessageList
              messages={conversation.messages}
              currentUserId={user?.id}
              view="buyer"
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
              sending={inbox.sending}
              view="buyer"
              onChange={inbox.setInputText}
              onSend={inbox.handleSendMessage}
            />
          </>
        ) : null
      }
    />
  );
};

export default InboxPage;
