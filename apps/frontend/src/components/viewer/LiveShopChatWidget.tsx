import React, { useEffect } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Fab,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import OpenInFullRoundedIcon from '@mui/icons-material/OpenInFullRounded';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import { useAuth } from '../../context/AuthContext';
import { useShopChatWidget } from '../../hooks/useShopChatWidget';
import { surfaceTokens } from '../../theme';
import { ChatInputBar } from '../inbox/ChatInputBar';
import { getConversationModeDisplay } from '../inbox/InboxSplitLayout';
import { MessageList } from '../inbox/MessageList';

interface LiveShopChatWidgetProps {
  sellerId: string;
  shopName: string;
  open: boolean;
  prefillMessage?: string | null;
  onConsumePrefill?: () => void;
  onOpen: () => void;
  onClose: () => void;
  onOpenFullInbox: () => void;
}

export const LiveShopChatWidget: React.FC<LiveShopChatWidgetProps> = ({
  sellerId,
  shopName,
  open,
  prefillMessage,
  onConsumePrefill,
  onOpen,
  onClose,
  onOpenFullInbox,
}) => {
  const { user } = useAuth();
  const {
    inputText,
    setInputText,
    sending,
    unreadCount,
    conversation,
    conversationMode,
    error,
    handleSendMessage,
  } = useShopChatWidget({
    sellerId,
    isOpen: open,
  });

  useEffect(() => {
    if (open && prefillMessage) {
      setInputText(prefillMessage);
      onConsumePrefill?.();
    }
  }, [open, prefillMessage, setInputText, onConsumePrefill]);

  const { isAiMode, modeLabel } = getConversationModeDisplay(
    conversationMode.status,
    conversationMode.loading,
  );
  const avatarLabel = shopName.trim().charAt(0).toUpperCase() || 'S';

  if (!open) {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 80, md: 84 },
          right: { xs: 16, md: 24 },
          zIndex: 1050,
        }}
      >
        <Tooltip title={`Tư vấn AI · ${shopName}`} placement="left">
          <Badge
            badgeContent={unreadCount}
            color="error"
            max={99}
            overlap="circular"
          >
            <Fab
              color="primary"
              onClick={onOpen}
              aria-label={
                unreadCount > 0
                  ? `Mở tư vấn AI với ${shopName}, có ${unreadCount} tin nhắn mới`
                  : `Mở tư vấn AI với ${shopName}`
              }
              sx={{
                width: 56,
                height: 56,
                boxShadow: '0 8px 24px rgba(29, 78, 216, 0.32)',
                transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                '&:hover': {
                  transform: 'scale(1.06)',
                  boxShadow: '0 12px 28px rgba(29, 78, 216, 0.38)',
                },
              }}
            >
              <SmartToyOutlinedIcon sx={{ fontSize: 26 }} />
            </Fab>
          </Badge>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Paper
      role="region"
      aria-label={`Tư vấn AI với ${shopName}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      }}
      sx={{
        position: 'fixed',
        bottom: { xs: 16, md: 24 },
        right: { xs: 12, md: 24 },
        width: { xs: 'calc(100vw - 24px)', sm: 360 },
        maxWidth: 380,
        height: {
          xs: 'min(66dvh, 500px)',
          md: 'min(520px, calc(100dvh - 104px))',
        },
        zIndex: 1150,
        borderRadius: 3.5,
        boxShadow: '0 16px 40px rgba(15, 23, 42, 0.16)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      {/* Compact Shop Chat Header */}
      <Stack
        direction="row"
        spacing={1}
        sx={{
          px: 1.5,
          py: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <Stack
          direction="row"
          spacing={1.25}
          sx={{ alignItems: 'center', minWidth: 0, flex: 1 }}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              fontSize: '0.95rem',
              fontWeight: 700,
              bgcolor: surfaceTokens.aiSoft,
              color: surfaceTokens.aiText,
              flexShrink: 0,
            }}
          >
            {avatarLabel}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="subtitle2"
              noWrap
              title={shopName}
              sx={{ fontWeight: 700, color: 'text.primary' }}
            >
              {shopName}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: isAiMode
                  ? surfaceTokens.aiText
                  : surfaceTokens.successText,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
              }}
            >
              <Box
                component="span"
                aria-hidden="true"
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  bgcolor: isAiMode
                    ? surfaceTokens.aiText
                    : surfaceTokens.successMain,
                  flexShrink: 0,
                }}
              />
              <Box
                component="span"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {modeLabel}
              </Box>
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', flexShrink: 0 }}
        >
          <Tooltip title="Mở Hộp thư đầy đủ">
            <IconButton
              aria-label="Mở Hộp thư đầy đủ"
              onClick={onOpenFullInbox}
              sx={{
                minWidth: 44,
                minHeight: 44,
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: surfaceTokens.primarySoft,
                },
              }}
            >
              <OpenInFullRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Thu gọn khung chat">
            <IconButton
              aria-label="Thu gọn khung chat"
              onClick={onClose}
              sx={{
                minWidth: 44,
                minHeight: 44,
                color: 'text.secondary',
                '&:hover': {
                  color: 'text.primary',
                  bgcolor: surfaceTokens.mutedBg,
                },
              }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <MessageList
        messages={conversation.messages}
        currentUserId={user?.id}
        view="buyer"
        loading={conversation.loadingMessages}
        loadingMore={conversation.loadingMore}
        hasMore={conversation.hasMore}
        error={error}
        scrollContainerRef={conversation.scrollContainerRef}
        chatEndRef={conversation.chatEndRef}
        onScroll={conversation.handleScroll}
        onLoadMore={conversation.loadMore}
        compact
      />

      <ChatInputBar
        value={inputText}
        sending={sending}
        view="buyer"
        onChange={setInputText}
        onSend={handleSendMessage}
      />
    </Paper>
  );
};
