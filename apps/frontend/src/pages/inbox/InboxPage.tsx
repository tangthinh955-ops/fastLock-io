import React, { useState } from 'react';
import { Button, useMediaQuery, useTheme } from '@mui/material';
import LiveTvOutlinedIcon from '@mui/icons-material/LiveTvOutlined';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobilePane, setMobilePane] = useState<'list' | 'chat'>(() =>
    searchParams.get('sellerId') ? 'chat' : 'list',
  );
  const inbox = useBuyerInbox({
    autoSelectFirst: isDesktop,
    isChatVisible: isDesktop || mobilePane === 'chat',
  });
  const { conversation } = inbox;
  const { status, loading: loadingMode } = inbox.conversationMode;
  const { isAiMode, modeLabel } = getConversationModeDisplay(status, loadingMode);
  const isEmptyShops = !inbox.loadingShops && !inbox.error && inbox.shops.length === 0;
  const effectiveMobilePane =
    mobilePane === 'chat' && (inbox.selectedShop || inbox.loadingShops)
      ? 'chat'
      : 'list';

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
      mobilePane={effectiveMobilePane}
      hasError={Boolean(inbox.error)}
      emptyMessage={
        inbox.error ||
        (isEmptyShops
          ? 'Bạn chưa có cuộc trò chuyện nào với Shop. Hãy vào phòng Livestream của Shop để nhắn tư vấn AI hoặc chốt đơn.'
          : 'Chọn một kênh để xem nội dung trao đổi.')
      }
      emptyAction={
        isEmptyShops ? (
          <Button
            variant="contained"
            color="primary"
            startIcon={<LiveTvOutlinedIcon />}
            onClick={() => navigate('/viewer')}
            sx={{ minHeight: 44, borderRadius: 2, fontWeight: 700 }}
          >
            Khám phá Shop & Phòng Live
          </Button>
        ) : undefined
      }
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
