import React, { type RefObject } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import type {
  ActiveLivestream,
  LivestreamComment,
} from '../../hooks/useViewerLivestream';
import { surfaceTokens } from '../../theme';

interface LiveCommentPanelProps {
  activeStream: ActiveLivestream | null;
  shopName?: string;
  canConsult?: boolean;
  loading: boolean;
  connected: boolean;
  error: string;
  comments: LivestreamComment[];
  currentUserName?: string;
  inputText: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onRetry: () => void;
  onOpenConsult: () => void;
  chatEndRef: RefObject<HTMLDivElement | null>;
}

export const LiveCommentPanel: React.FC<LiveCommentPanelProps> = ({
  activeStream,
  shopName,
  canConsult = false,
  loading,
  connected,
  error,
  comments,
  currentUserName,
  inputText,
  onInputChange,
  onSend,
  onRetry,
  onOpenConsult,
  chatEndRef,
}) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        flex: 1,
        minWidth: { xs: 0, md: 360 },
        maxWidth: { md: 440 },
        minHeight: 0,
        borderRadius: { xs: 0, md: 3 },
        border: { xs: 'none', md: `1px solid ${surfaceTokens.borderSubtle}` },
        borderTop: { xs: `1px solid ${surfaceTokens.borderSubtle}` },
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      {/* Header & Quick Consult Action */}
      <Box
        sx={{
          px: { xs: 1.75, md: 2 },
          py: { xs: 1.25, md: 1.75 },
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Stack
          direction="row"
          spacing={1.25}
          sx={{ alignItems: 'center', justifyContent: 'space-between', minWidth: 0 }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              <ChatBubbleOutlineRoundedIcon
                sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }}
              />
              <Typography
                variant="subtitle1"
                noWrap
                sx={{ fontWeight: 700, color: 'text.primary' }}
              >
                Bình luận trực tiếp
              </Typography>
            </Stack>
            <Typography
              variant="caption"
              noWrap
              sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}
            >
              {activeStream
                ? `${activeStream.seller.name} · ${connected ? 'Đã kết nối' : 'Đang kết nối...'}`
                : loading
                  ? 'Đang tải livestream...'
                  : shopName
                    ? `${shopName} · Hiện đang OFFLINE`
                    : 'Hiện chưa có shop phát sóng'}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            size="small"
            startIcon={<ForumOutlinedIcon fontSize="small" />}
            disabled={!activeStream && !canConsult}
            onClick={onOpenConsult}
            sx={{
              flexShrink: 0,
              borderColor: 'primary.main',
              color: 'primary.main',
              bgcolor: surfaceTokens.primarySoft,
              '&:hover': {
                bgcolor: surfaceTokens.primaryBorder,
                borderColor: 'primary.dark',
              },
            }}
          >
            Tư vấn Shop
          </Button>
        </Stack>

        <Box
          sx={{
            mt: 1,
            px: 1.25,
            py: 0.75,
            borderRadius: 1.5,
            bgcolor: surfaceTokens.pageBg,
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
          }}
        >
          <ShoppingBagOutlinedIcon
            sx={{ fontSize: 16, color: 'success.main', flexShrink: 0 }}
          />
          <Typography variant="caption" color="text.secondary">
            Chốt đơn nhanh: gõ <strong>Mã SKU + SĐT</strong> (VD: SP01 0912345678)
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ borderRadius: 0 }}
          action={
            <Button color="inherit" size="small" onClick={onRetry}>
              Thử lại
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Comment Stream */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          p: { xs: 1.5, md: 2 },
          overflowY: 'auto',
          bgcolor: surfaceTokens.pageBg,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {comments.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ my: 'auto', px: 2 }}
          >
            {activeStream
              ? 'Hãy gửi bình luận để trò chuyện hoặc chốt đơn trực tiếp.'
              : 'Bấm Thử lại sau khi Shop bắt đầu livestream.'}
          </Typography>
        )}

        {comments.map((comment) => {
          const isSelf = comment.buyerName === currentUserName;
          return (
            <Box
              key={comment.id}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                flexDirection: isSelf ? 'row-reverse' : 'row',
              }}
            >
              <Avatar
                sx={{
                  bgcolor: comment.isOrder ? 'success.main' : '#475569',
                  width: 32,
                  height: 32,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {comment.buyerName.charAt(0).toUpperCase() || 'K'}
              </Avatar>
              <Paper
                variant="outlined"
                sx={{
                  px: 1.5,
                  py: 1,
                  maxWidth: '78%',
                  minWidth: 0,
                  bgcolor: comment.isOrder
                    ? surfaceTokens.successSoft
                    : isSelf
                      ? surfaceTokens.primarySoft
                      : 'background.paper',
                  borderColor: comment.isOrder
                    ? surfaceTokens.successBorder
                    : isSelf
                      ? surfaceTokens.primaryBorder
                      : 'divider',
                  borderRadius: 2.5,
                }}
              >
                <Stack
                  direction="row"
                  spacing={0.75}
                  sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.25 }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: comment.isOrder
                        ? surfaceTokens.successText
                        : 'text.secondary',
                    }}
                  >
                    {comment.buyerName}
                  </Typography>
                  {comment.isOrder && comment.sku && (
                    <Chip
                      label={`Đã chốt ${comment.sku}`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.75rem',
                        bgcolor: surfaceTokens.successBubble,
                        color: surfaceTokens.successText,
                      }}
                    />
                  )}
                </Stack>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.primary',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {comment.content}
                </Typography>
              </Paper>
            </Box>
          );
        })}
        <div ref={chatEndRef} />
      </Box>

      {/* Sticky Comment Input */}
      <Box
        sx={{
          p: { xs: 1.25, md: 1.5 },
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Gõ bình luận (VD: SP01 0912345678)..."
          variant="outlined"
          value={inputText}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSend();
          }}
          disabled={!connected}
        />
        <IconButton
          color="primary"
          aria-label="Gửi bình luận"
          onClick={onSend}
          disabled={!inputText.trim() || !connected}
          sx={{
            bgcolor:
              inputText.trim() && connected
                ? 'primary.main'
                : surfaceTokens.mutedBg,
            color:
              inputText.trim() && connected
                ? 'primary.contrastText'
                : 'text.disabled',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          }}
        >
          <SendRoundedIcon fontSize="small" />
        </IconButton>
      </Box>
    </Paper>
  );
};

