import React, { useState, useRef, useEffect } from 'react';
import { Container, Typography, Paper, Box, TextField, IconButton, Avatar, Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';

interface ChatMessage {
  id: string;
  text: string;
}

interface Shop {
  id: string;
  name: string;
}

export const ViewerPage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('livestream_chat_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputText, setInputText] = useState('');
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('livestream_chat_history', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    let active = true;

    const fetchCurrentShop = async () => {
      try {
        const response = await apiClient.get<Shop[]>('/messages/shops');
        if (active) setCurrentShop(response.data[0] ?? null);
      } catch (error) {
        console.error('Lỗi khi tải thông tin shop livestream:', error);
      }
    };

    fetchCurrentShop();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    const text = inputText.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, height: '80vh', display: 'flex' }}>
      
      {/* CỘT TRÁI: GIẢ LẬP VIDEO LIVESTREAM */}
      <Box sx={{ flex: 2, bgcolor: '#000', borderRadius: 2, mr: 2, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Placeholder Video */}
        <Typography variant="h5" color="white" sx={{ zIndex: 10 }}>
          📺 [VIDEO LIVESTREAM BÁN HÀNG]
        </Typography>
        <img 
          src="https://images.unsplash.com/photo-1574634534894-89d7576c8259?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
          alt="livestream" 
          style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} 
        />
        <Box sx={{ position: 'absolute', top: 16, left: 16, bgcolor: 'red', color: 'white', px: 1.5, py: 0.5, borderRadius: 1, fontWeight: 'bold' }}>
          LIVE
        </Box>
      </Box>

      {/* CỘT PHẢI: KHUNG BÌNH LUẬN LIVESTREAM */}
      <Paper elevation={3} sx={{ flex: 1, borderRadius: 2, display: 'flex', flexDirection: 'column', bgcolor: '#f8f9fa' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: 'white', borderRadius: '8px 8px 0 0' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>💬 Bình luận trực tiếp</Typography>
          <Typography variant="caption" color="text.secondary">
            {currentShop ? `Livestream của ${currentShop.name}` : 'Đang tải thông tin shop...'}
          </Typography>
        </Box>
        
        {/* Vùng hiển thị tin nhắn */}
        <Box sx={{ flex: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {messages.length === 0 && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
              Hãy gửi bình luận để trò chuyện trong livestream.
            </Typography>
          )}

          {messages.map((msg) => (
            <Box key={msg.id} sx={{ display: 'flex', alignItems: 'flex-start', flexDirection: 'row-reverse' }}>
              <Avatar sx={{ bgcolor: '#1e3a5f', width: 32, height: 32, ml: 1 }}>
                K
              </Avatar>
              <Paper sx={{ p: 1.5, maxWidth: '75%', bgcolor: '#dbeafe', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Khách hàng
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {msg.text}
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
            disabled={!currentShop}
            onClick={() => navigate(`/inbox?sellerId=${currentShop?.id}`)}
            sx={{ borderColor: '#1e3a5f', color: '#1e3a5f' }}
          >
            Tư vấn riêng với Shop
          </Button>
        </Box>

        {/* Khung nhập tin nhắn */}
        <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #e0e0e0', borderRadius: '0 0 8px 8px', display: 'flex', gap: 1 }}>
          <TextField 
            fullWidth 
            size="small" 
            placeholder="Gõ bình luận (VD: Áo này có size M không shop?)..." 
            variant="outlined"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
          />
          <IconButton color="primary" onClick={handleSendMessage} disabled={!inputText.trim()}>
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>

    </Container>
  );
};
