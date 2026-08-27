import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Box, Avatar, Divider, Chip } from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import apiClient from '../../api/client';

interface DirectMessage {
  id: string;
  content: string;
  qrUrl: string | null;
  createdAt: string;
  sender: {
    name: string;
    role: string;
  };
}

export const InboxPage: React.FC = () => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await apiClient.get('/messages/my-inbox');
        setMessages(res.data);
      } catch (error) {
        console.error('Lỗi khi tải hộp thư:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, []);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        
        {/* Header Hộp thư */}
        <Box sx={{ p: 3, bgcolor: '#ee4d2d', color: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
          <StorefrontIcon fontSize="large" />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Hộp Thư Mua Sắm (Shopee Style)</Typography>
        </Box>

        {/* Danh sách tin nhắn */}
        <Box sx={{ p: 0, bgcolor: '#f5f5f5', minHeight: '60vh' }}>
          {loading ? (
            <Typography sx={{ p: 4, textAlign: 'center' }}>Đang tải tin nhắn...</Typography>
          ) : messages.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <img src="https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/assets/5fafbb923393b712b96488590b8f781f.png" alt="Empty Inbox" style={{ width: 120, opacity: 0.5 }} />
              <Typography sx={{ mt: 2, color: 'text.secondary' }}>Chưa có tin nhắn hoặc đơn hàng nào.</Typography>
            </Box>
          ) : (
            messages.map((msg) => (
              <React.Fragment key={msg.id}>
                <Box sx={{ p: 3, display: 'flex', gap: 2, bgcolor: 'white', '&:hover': { bgcolor: '#fafafa' } }}>
                  
                  {/* Avatar Shop */}
                  <Avatar sx={{ bgcolor: '#ee4d2d', width: 50, height: 50 }}>
                    {msg.sender.name.charAt(0).toUpperCase()}
                  </Avatar>
                  
                  {/* Nội dung */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {msg.sender.name} <Chip label="Mall" size="small" color="error" sx={{ height: 20, fontSize: '0.6rem' }} />
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(msg.createdAt).toLocaleString('vi-VN')}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
                      {msg.content}
                    </Typography>

                    {/* QR Code (Nếu có) */}
                    {msg.qrUrl && (
                      <Paper variant="outlined" sx={{ p: 2, display: 'inline-block', borderRadius: 2, bgcolor: '#fdfdfd' }}>
                        <Typography variant="body2" color="primary" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
                          💰 QUÉT MÃ ĐỂ THANH TOÁN
                        </Typography>
                        <img src={msg.qrUrl} alt="VietQR" style={{ width: '200px', height: '200px', objectFit: 'contain' }} />
                      </Paper>
                    )}
                  </Box>
                </Box>
                <Divider />
              </React.Fragment>
            ))
          )}
        </Box>
      </Paper>
    </Container>
  );
};
