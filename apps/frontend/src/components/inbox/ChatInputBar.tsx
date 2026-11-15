import React from 'react';
import { Box, CircularProgress, IconButton, TextField } from '@mui/material';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import type { InboxView } from './types';
import { surfaceTokens } from '../../theme';

interface ChatInputBarProps {
  value: string;
  sending: boolean;
  view: InboxView;
  onChange: (value: string) => void;
  onSend: () => void;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  value,
  sending,
  view,
  onChange,
  onSend,
}) => {
  const placeholder =
    view === 'buyer'
      ? sending
        ? 'Trợ lý AI đang trả lời...'
        : 'Nhập câu hỏi cho shop...'
      : 'Nhập tin nhắn trả lời khách hàng...';
  const canSend = Boolean(value.trim()) && !sending;

  return (
    <Box
      sx={{
        p: { xs: 1.25, sm: 1.75 },
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
      }}
    >
      <TextField
        fullWidth
        multiline
        maxRows={4}
        size="small"
        value={value}
        disabled={sending}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onSend();
          }
        }}
        slotProps={{ htmlInput: { maxLength: 1000 } }}
      />
      <IconButton
        color="primary"
        onClick={onSend}
        disabled={!canSend}
        aria-label={
          view === 'buyer' ? 'Gửi tin nhắn' : 'Gửi tin nhắn cho khách hàng'
        }
        sx={{
          bgcolor: canSend ? 'primary.main' : surfaceTokens.mutedBg,
          color: canSend ? 'primary.contrastText' : 'text.disabled',
          '&:hover': {
            bgcolor: 'primary.dark',
          },
        }}
      >
        {sending ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          <SendRoundedIcon fontSize="small" />
        )}
      </IconButton>
    </Box>
  );
};
