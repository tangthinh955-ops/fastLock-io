import React, { useState } from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import QrCode2OutlinedIcon from '@mui/icons-material/QrCode2Outlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import type { DirectMessage, InboxView, MessageSource } from './types';
import { surfaceTokens } from '../../theme';

interface MessageBubbleProps {
  message: DirectMessage;
  currentUserId?: string;
  view: InboxView;
  compact?: boolean;
}

const getSourcePresentation = (
  source: MessageSource,
  senderName: string,
  isOwnMessage: boolean,
) => {
  switch (source) {
    case 'BUYER':
      return {
        label: isOwnMessage ? 'Bạn' : senderName,
        icon: <PersonOutlinedIcon sx={{ fontSize: 14 }} />,
        labelColor: isOwnMessage
          ? surfaceTokens.primaryMain
          : surfaceTokens.textSecondary,
        bgcolor: isOwnMessage ? surfaceTokens.primarySoft : surfaceTokens.cardBg,
        borderColor: isOwnMessage
          ? surfaceTokens.primaryBorder
          : surfaceTokens.borderSubtle,
      };
    case 'SELLER':
      return {
        label: isOwnMessage ? `${senderName} · Bạn` : `${senderName} · Nhân viên Shop`,
        icon: <StorefrontOutlinedIcon sx={{ fontSize: 14 }} />,
        labelColor: isOwnMessage
          ? surfaceTokens.primaryMain
          : surfaceTokens.textPrimary,
        bgcolor: isOwnMessage ? surfaceTokens.primarySoft : surfaceTokens.cardBg,
        borderColor: isOwnMessage
          ? surfaceTokens.primaryBorder
          : surfaceTokens.borderStrong,
      };
    case 'AI':
      return {
        label: `${senderName} · Trợ lý AI`,
        icon: <SmartToyOutlinedIcon sx={{ fontSize: 14 }} />,
        labelColor: surfaceTokens.aiText,
        bgcolor: surfaceTokens.aiSoft,
        borderColor: surfaceTokens.aiBorder,
      };
    case 'SYSTEM':
      return {
        label: `${senderName} · Hệ thống`,
        icon: <CheckCircleOutlineRoundedIcon sx={{ fontSize: 14 }} />,
        labelColor: surfaceTokens.warningText,
        bgcolor: surfaceTokens.systemSoft,
        borderColor: surfaceTokens.warningSoft,
      };
    default:
      return {
        label: senderName,
        icon: null,
        labelColor: surfaceTokens.textSecondary,
        bgcolor: surfaceTokens.cardBg,
        borderColor: surfaceTokens.borderSubtle,
      };
  }
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  currentUserId,
  view,
  compact = false,
}) => {
  const [qrLoadFailed, setQrLoadFailed] = useState(false);
  const payosUrlMatch = message.content.match(/https:\/\/pay\.payos\.vn\/[^\s]+/i);
  const payosCheckoutUrl = payosUrlMatch?.[0] ?? null;
  const isOwnMessage = message.senderId === currentUserId;
  const alignRight =
    view === 'buyer'
      ? isOwnMessage
      : message.source === 'SELLER' || message.source === 'AI' || message.source === 'SYSTEM'
        ? isOwnMessage
        : false;
  const style = getSourcePresentation(
    message.source,
    message.sender.name,
    isOwnMessage,
  );

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: alignRight ? 'flex-end' : 'flex-start',
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          p: compact ? 1.5 : { xs: 1.5, sm: 2 },
          maxWidth: compact ? '88%' : { xs: '88%', sm: '76%', md: '70%' },
          minWidth: 0,
          bgcolor: style.bgcolor,
          borderColor: style.borderColor,
          borderRadius: alignRight
            ? '16px 16px 4px 16px'
            : '16px 16px 16px 4px',
        }}
      >
        <Stack
          direction="row"
          spacing={0.5}
          sx={{ alignItems: 'center', color: style.labelColor, mb: 0.5 }}
        >
          {style.icon}
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: 'inherit' }}
          >
            {style.label}
          </Typography>
        </Stack>

        <Typography
          sx={{
            color: 'text.primary',
            fontSize: '0.95rem',
            lineHeight: 1.55,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
          }}
        >
          {message.content}
        </Typography>

        {message.qrUrl &&
          (view === 'seller' ? (
            <Box
              sx={{
                mt: 1.25,
                px: 1.5,
                py: 1,
                borderRadius: 2,
                bgcolor: surfaceTokens.cardBg,
                border: `1px solid ${surfaceTokens.borderSubtle}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                color: surfaceTokens.textSecondary,
              }}
            >
              <QrCode2OutlinedIcon fontSize="small" color="primary" />
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'inherit' }}>
                Đã đính kèm mã thanh toán VietQR cho khách hàng
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                mt: 1.75,
                p: { xs: 1.5, sm: 2 },
                bgcolor: surfaceTokens.cardBg,
                borderRadius: 2.5,
                border: `1px dashed ${surfaceTokens.borderStrong}`,
                textAlign: 'center',
              }}
            >
              <Stack
                direction="row"
                spacing={0.75}
                sx={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1.25,
                  color: 'primary.main',
                }}
              >
                <QrCode2OutlinedIcon fontSize="small" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Mã thanh toán VietQR
                </Typography>
              </Stack>
              {!qrLoadFailed ? (
                <>
                  <Box
                    component="img"
                    src={message.qrUrl}
                    alt="Mã thanh toán VietQR"
                    onError={() => setQrLoadFailed(true)}
                    sx={{
                      width: '100%',
                      maxWidth: 220,
                      height: 'auto',
                      display: 'block',
                      mx: 'auto',
                      borderRadius: 1.5,
                      bgcolor: '#FFFFFF',
                      p: 0.75,
                      border: `1px solid ${surfaceTokens.borderSubtle}`,
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 1 }}
                  >
                    Mở ứng dụng ngân hàng và quét mã để thanh toán đơn hàng.
                  </Typography>
                </>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Không tải được ảnh VietQR trên mạng hiện tại. Vui lòng xem
                  thông tin đơn hàng ở nội dung tin nhắn phía trên.
                </Typography>
              )}
              {payosCheckoutUrl && (
                <Button
                  component="a"
                  href={payosCheckoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="contained"
                  color="primary"
                  size="small"
                  endIcon={<OpenInNewRoundedIcon fontSize="small" />}
                  sx={{ mt: 1.25, minHeight: 40, fontWeight: 700 }}
                >
                  Mở trang thanh toán payOS
                </Button>
              )}
            </Box>
          ))}

        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 1,
            textAlign: 'right',
            color: surfaceTokens.textSecondary,
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
