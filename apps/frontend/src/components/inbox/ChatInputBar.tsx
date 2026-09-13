import React from 'react';
import { Box, CircularProgress, IconButton, TextField } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import type { InboxView } from './types';

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

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: 'white',
        borderTop: '1px solid #e2e8f0',
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
        disabled={!value.trim() || sending}
        aria-label={
          view === 'buyer' ? 'Gửi tin nhắn' : 'Gửi tin nhắn cho khách hàng'
        }
        sx={{ mb: 0.25 }}
      >
        {sending ? <CircularProgress size={24} /> : <SendIcon />}
      </IconButton>
    </Box>
  );
};
