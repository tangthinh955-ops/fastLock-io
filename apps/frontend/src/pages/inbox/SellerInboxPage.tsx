import React from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import { ChatHeader } from '../../components/inbox/ChatHeader';
import { ChatInputBar } from '../../components/inbox/ChatInputBar';
import { CustomerSidebar } from '../../components/inbox/CustomerSidebar';
import { InboxPageHeader } from '../../components/inbox/InboxPageHeader';
import { MessageList } from '../../components/inbox/MessageList';
import { useAuth } from '../../context/AuthContext';
import { useSellerInbox } from '../../hooks/useSellerInbox';

export const SellerInboxPage: React.FC = () => {
  const { user } = useAuth();
  const inbox = useSellerInbox();
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
          title="Tin nhắn khách hàng"
          description="Kiểm tra các cuộc trò chuyện giữa khách và trợ lý AI của shop."
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
          <CustomerSidebar
            customers={inbox.customers}
            selectedCustomerId={inbox.selectedCustomerId}
            loading={inbox.loadingCustomers}
            disabled={inbox.sending}
            onSelect={inbox.setSelectedCustomerId}
          />

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {inbox.selectedCustomer ? (
              <>
                <ChatHeader
                  name={inbox.selectedCustomer.name}
                  statusText="Lịch sử Buyer ↔ Shop"
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
                  sending={inbox.sending}
                  view="seller"
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
                    'Chọn một khách hàng để xem lịch sử trò chuyện.'}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default SellerInboxPage;
