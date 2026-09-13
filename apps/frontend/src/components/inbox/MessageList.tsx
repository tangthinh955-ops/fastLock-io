import React from 'react';
import type { RefObject, UIEventHandler } from 'react';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { MessageBubble } from './MessageBubble';
import {
  MESSAGE_PAGE_SIZE,
  type DirectMessage,
  type InboxView,
} from './types';

interface MessageListProps {
  messages: DirectMessage[];
  currentUserId?: string;
  view: InboxView;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  chatEndRef: RefObject<HTMLDivElement | null>;
  onScroll: UIEventHandler<HTMLDivElement>;
  onLoadMore: () => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  view,
  loading,
  loadingMore,
  hasMore,
  error,
  scrollContainerRef,
  chatEndRef,
  onScroll,
  onLoadMore,
}) => (
  <Box
    ref={scrollContainerRef}
    onScroll={onScroll}
    sx={{
      flex: 1,
      p: 3,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      overflowY: 'auto',
      minHeight: 0,
      maxHeight: { xs: '50vh', md: 'none' },
      bgcolor: view === 'buyer' ? '#f8fafc' : undefined,
    }}
  >
    {error && <Alert severity="error">{error}</Alert>}

    {loading ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress sx={{ color: '#2563eb' }} />
      </Box>
    ) : messages.length === 0 ? (
      <Box sx={{ textAlign: 'center', mt: view === 'buyer' ? 8 : 6 }}>
        <Typography color="text.secondary" sx={{ fontSize: '0.95rem' }}>
          {view === 'buyer'
            ? 'Chưa có tin nhắn nào trong cuộc trò chuyện này.'
            : 'Chưa có tin nhắn với khách hàng này.'}
        </Typography>
        {view === 'buyer' && (
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ display: 'block', mt: 0.5 }}
          >
            Các phản hồi của AI và mã thanh toán VietQR sẽ hiển thị tại đây.
          </Typography>
        )}
      </Box>
    ) : (
      <>
        {hasMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <Button
              size="small"
              variant="text"
              onClick={onLoadMore}
              disabled={loadingMore}
              sx={{ color: '#2563eb' }}
            >
              {loadingMore ? (
                <CircularProgress size={20} sx={{ color: '#2563eb' }} />
              ) : (
                'Tải tin nhắn cũ'
              )}
            </Button>
          </Box>
        )}
        {!hasMore && messages.length >= MESSAGE_PAGE_SIZE && (
          <Typography
            variant="caption"
            align="center"
            sx={{
              color: '#94a3b8',
              fontStyle: 'italic',
              display: 'block',
              my: 0.5,
            }}
          >
            Đầu cuộc trò chuyện
          </Typography>
        )}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            currentUserId={currentUserId}
            view={view}
          />
        ))}
      </>
    )}
    <div ref={chatEndRef} />
  </Box>
);
