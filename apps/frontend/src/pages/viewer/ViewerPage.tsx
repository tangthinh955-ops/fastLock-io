import React, { useState, useRef, useEffect } from 'react';
import { Container, Typography, Paper, Box, TextField, IconButton, Avatar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import apiClient from '../../api/client';

interface ChatMessage {
  id: string;
  sender: 'user' | 'shop';
  text: string;
}

export const ViewerPage: React.FC = () => {
  // 1. Khởi tạo state từ localStorage (Tránh mất tin nhắn khi F5)
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('chat_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Dùng để hủy request API (Hủy kết nối) khi component bị unmount
  const abortControllerRef = useRef<AbortController | null>(null);

  // Lưu tin nhắn vào localStorage mỗi khi có tin nhắn mới
  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages));
  }, [messages]);

  // Cleanup effect: Khi người dùng chuyển trang (unmount), Hủy ngay API đang gọi
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Cuộn xuống dòng tin nhắn mới nhất
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsAiTyping(true);

    // Hủy kết nối cũ (nếu khách spam gửi nhiều tin liên tục)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // Bọc tín hiệu hủy (signal) vào API call
      // Tạm thời hardcode lấy 1 sellerId (Trong thực tế Phase 2, ID này lấy từ URL Livestream)
      // Khách hàng đang xem stream của ai thì ném ID người đó vào
      const res = await apiClient.post(
        '/ai/chat', 
        { 
          sellerId: 'ID_CỦA_CHỦ_SHOP_HIỆN_TẠI', // Chỗ này Phase 2 sẽ lấy từ URL param
          message: userMsg.text 
        },
        { signal: abortControllerRef.current.signal }
      );
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'shop',
        text: res.data.reply,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      // Bắt lỗi Hủy kết nối (Bỏ qua, không gọi setMessages nữa)
      if (error.name === 'CanceledError' || error.message === 'canceled') {
        console.log('API đã bị ngắt kết nối do người dùng chuyển trang!');
        return; 
      }
      
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'shop',
        text: 'Dạ mạng bên em hơi lag, anh/chị chat lại giúp em nha!',
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAiTyping(false);
    }
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

      {/* CỘT PHẢI: KHUNG CHAT TÍCH HỢP AI */}
      <Paper elevation={3} sx={{ flex: 1, borderRadius: 2, display: 'flex', flexDirection: 'column', bgcolor: '#f8f9fa' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: 'white', borderRadius: '8px 8px 0 0' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>💬 Khung Chat Tự Động (AI)</Typography>
        </Box>
        
        {/* Vùng hiển thị tin nhắn */}
        <Box sx={{ flex: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {messages.length === 0 && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
              Hãy hỏi một câu về sản phẩm để xem AI phản hồi nhé!
            </Typography>
          )}

          {messages.map((msg) => (
            <Box key={msg.id} sx={{ display: 'flex', alignItems: 'flex-start', flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row' }}>
              <Avatar sx={{ bgcolor: msg.sender === 'user' ? '#1976d2' : '#ff5722', width: 32, height: 32, ml: msg.sender === 'user' ? 1 : 0, mr: msg.sender === 'shop' ? 1 : 0 }}>
                {msg.sender === 'user' ? 'K' : 'S'}
              </Avatar>
              <Paper sx={{ p: 1.5, maxWidth: '75%', bgcolor: msg.sender === 'user' ? '#bbdefb' : 'white', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {msg.sender === 'user' ? 'Khách hàng' : 'Nhân viên AI (Shop)'}
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {msg.text}
                </Typography>
              </Paper>
            </Box>
          ))}
          {isAiTyping && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 6 }}>
              Shop đang gõ câu trả lời...
            </Typography>
          )}
          <div ref={chatEndRef} />
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
          <IconButton color="primary" onClick={handleSendMessage} disabled={!inputText.trim() || isAiTyping}>
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>

    </Container>
  );
};
