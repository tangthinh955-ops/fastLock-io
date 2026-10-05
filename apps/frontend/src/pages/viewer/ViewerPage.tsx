import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Container,
  IconButton,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import SendIcon from '@mui/icons-material/Send';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useViewerLivestream } from '../../hooks/useViewerLivestream';

export const ViewerPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const livestream = useViewerLivestream({
    buyerId: user?.id,
    buyerName: user?.name,
    token,
  });
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [livestream.comments]);

  const handleSendMessage = () => {
    const text = inputText.trim();
    if (!text) return;

    if (livestream.sendComment(text)) {
      setInputText('');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, height: '80vh', display: 'flex' }}>
      <Box
        sx={{
          flex: 2,
          bgcolor: '#000',
          borderRadius: 2,
          mr: 2,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h5" color="white" sx={{ zIndex: 10 }}>
          📺{' '}
          {livestream.activeStream?.title ||
            '[CHƯA CÓ LIVESTREAM ĐANG PHÁT]'}
        </Typography>
        <img
          src="https://images.unsplash.com/photo-1574634534894-89d7576c8259?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
          alt="livestream"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.5,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            bgcolor: livestream.activeStream ? 'red' : '#64748b',
            color: 'white',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            fontWeight: 'bold',
          }}
        >
          {livestream.activeStream ? 'LIVE' : 'OFFLINE'}
        </Box>
      </Box>

      <Paper
        elevation={3}
        sx={{
          flex: 1,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#f8f9fa',
        }}
      >
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid #e0e0e0',
            bgcolor: 'white',
            borderRadius: '8px 8px 0 0',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            💬 Bình luận trực tiếp
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {livestream.activeStream
              ? `Livestream của ${livestream.activeStream.seller.name} · ${livestream.connected ? 'Đã kết nối' : 'Đang kết nối...'}`
              : livestream.loading
                ? 'Đang tải thông tin livestream...'
                : 'Hiện chưa có shop nào phát sóng'}
          </Typography>
        </Box>

        {livestream.error && (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={livestream.loadActiveStream}
              >
                Thử lại
              </Button>
            }
          >
            {livestream.error}
          </Alert>
        )}

        <Box
          sx={{
            flex: 1,
            p: 2,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {livestream.comments.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ mt: 4 }}
            >
              {livestream.activeStream
                ? 'Hãy gửi bình luận để trò chuyện trong livestream.'
                : 'Bấm Thử lại sau khi Seller bắt đầu livestream.'}
            </Typography>
          )}

          {livestream.comments.map((comment) => (
            <Box
              key={comment.id}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                flexDirection:
                  comment.buyerName === user?.name ? 'row-reverse' : 'row',
              }}
            >
              <Avatar
                sx={{
                  bgcolor: comment.isOrder ? '#15803d' : '#1e3a5f',
                  width: 32,
                  height: 32,
                  mx: 1,
                }}
              >
                {comment.buyerName.charAt(0).toUpperCase() || 'K'}
              </Avatar>
              <Paper
                sx={{
                  p: 1.5,
                  maxWidth: '75%',
                  bgcolor: comment.isOrder ? '#dcfce7' : '#dbeafe',
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  gutterBottom
                  sx={{ fontWeight: 'bold' }}
                >
                  {comment.buyerName}
                  {comment.isOrder && ` · Đã chốt ${comment.sku}`}
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {comment.content}
                </Typography>
              </Paper>
            </Box>
          ))}
          <div ref={chatEndRef} />
        </Box>

        <Box sx={{ px: 2, pt: 1.5, bgcolor: 'white' }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ForumOutlinedIcon />}
            disabled={!livestream.activeStream}
            onClick={() =>
              navigate(`/inbox?sellerId=${livestream.activeStream?.sellerId}`)
            }
            sx={{ borderColor: '#1e3a5f', color: '#1e3a5f' }}
          >
            Tư vấn riêng với Shop
          </Button>
        </Box>

        <Box
          sx={{
            p: 2,
            bgcolor: 'white',
            borderTop: '1px solid #e0e0e0',
            borderRadius: '0 0 8px 8px',
            display: 'flex',
            gap: 1,
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Gõ bình luận (VD: SP01 0912345678)..."
            variant="outlined"
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleSendMessage();
            }}
            disabled={!livestream.connected}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!inputText.trim() || !livestream.connected}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Container>
  );
};

export default ViewerPage;
