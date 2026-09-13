import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import QrCode2OutlinedIcon from '@mui/icons-material/QrCode2Outlined';
import type { DirectMessage, InboxView } from './types';

interface MessageBubbleProps {
  message: DirectMessage;
  currentUserId?: string;
  view: InboxView;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  currentUserId,
  view,
}) => {
  const isOwnMessage = message.senderId === currentUserId;
  const senderLabel = isOwnMessage
    ? view === 'buyer'
      ? 'Bạn'
      : 'Shop / Trợ lý AI'
    : view === 'buyer'
      ? `${message.sender.name} (Shop / Trợ lý AI)`
      : message.sender.name;

  if (view === 'seller') {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            maxWidth: '75%',
            bgcolor: isOwnMessage ? '#eff6ff' : 'white',
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            {senderLabel}
          </Typography>
          <Typography
            sx={{
              mt: 0.5,
              color: '#1e293b',
              fontSize: '0.95rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}
          >
            {message.content}
          </Typography>
          {message.qrUrl && (
            <Typography
              variant="caption"
              color="primary"
              sx={{ display: 'block', mt: 0.5 }}
            >
              Tin nhắn này có kèm mã VietQR.
            </Typography>
          )}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 1,
              textAlign: 'right',
              color: '#94a3b8',
              fontSize: '0.72rem',
            }}
          >
            {new Date(message.createdAt).toLocaleString('vi-VN')}
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          maxWidth: { xs: '85%', md: '70%' },
          bgcolor: isOwnMessage ? '#eff6ff' : 'white',
          border: '1px solid',
          borderColor: isOwnMessage ? '#bfdbfe' : '#e2e8f0',
          borderRadius: isOwnMessage
            ? '16px 16px 4px 16px'
            : '16px 16px 16px 4px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: isOwnMessage ? '#1d4ed8' : '#475569',
            display: 'block',
            mb: 0.5,
          }}
        >
          {senderLabel}
        </Typography>
        <Typography
          sx={{
            color: '#1e293b',
            fontSize: '0.95rem',
            lineHeight: 1.55,
            whiteSpace: 'pre-wrap',
          }}
        >
          {message.content}
        </Typography>
        {message.qrUrl && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: '#f8fafc',
              borderRadius: 2,
              border: '1px dashed #94a3b8',
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                mb: 1.5,
                color: '#1e3a8a',
              }}
            >
              <QrCode2OutlinedIcon />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                MÃ THANH TOÁN VIETQR
              </Typography>
            </Box>
            <Box
              component="img"
              src={message.qrUrl}
              alt="Mã thanh toán VietQR"
              sx={{
                width: 220,
                maxWidth: '100%',
                borderRadius: 1.5,
                bgcolor: 'white',
                p: 1,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}
            >
              Mở app ngân hàng quét mã để thanh toán đơn hàng
            </Typography>
          </Box>
        )}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 1.2,
            textAlign: 'right',
            color: '#94a3b8',
            fontSize: '0.72rem',
          }}
        >
          {new Date(message.createdAt).toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
          })}
        </Typography>
      </Paper>
    </Box>
  );
};
