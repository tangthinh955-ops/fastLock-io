import React from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import { ChatHeader } from '../../components/inbox/ChatHeader';
import { ChatInputBar } from '../../components/inbox/ChatInputBar';
import { InboxPageHeader } from '../../components/inbox/InboxPageHeader';
import { MessageList } from '../../components/inbox/MessageList';
import { ShopSidebar } from '../../components/inbox/ShopSidebar';
import { useAuth } from '../../context/AuthContext';
import { useBuyerInbox } from '../../hooks/useBuyerInbox';

export const InboxPage: React.FC = () => {
  const { user } = useAuth();
  const inbox = useBuyerInbox();
  const { conversation } = inbox;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper
        elevation={2}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
      >
        <InboxPageHeader
          title="Hộp thư Trao đổi & Đơn hàng"
          description="Xem nội dung tư vấn sản phẩm và hóa đơn thanh toán VietQR từ các Shop"
        />

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            minHeight: '65vh',
            height: { md: '65vh' },
            bgcolor: '#f8fafc',
          }}
        >
          <ShopSidebar
            shops={inbox.shops}
            selectedShopId={inbox.selectedShopId}
            loading={inbox.loadingShops}
            disabled={inbox.sending}
            onSelect={inbox.setSelectedShopId}
          />

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {inbox.selectedShop ? (
              <>
                <ChatHeader
                  name={inbox.selectedShop.name}
                  statusText="Trợ lý AI sẵn sàng hỗ trợ"
                  badgeLabel="Kênh chính thức"
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
            ) : (
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 4,
                }}
              >
                <Typography color={inbox.error ? 'error' : 'text.secondary'}>
                  {inbox.error ||
                    'Chọn một kênh bên trái để xem nội dung trao đổi.'}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default InboxPage;
