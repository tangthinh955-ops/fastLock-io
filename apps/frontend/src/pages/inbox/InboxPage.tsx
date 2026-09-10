import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import QrCode2OutlinedIcon from '@mui/icons-material/QrCode2Outlined';
import SendIcon from '@mui/icons-material/Send';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface Shop {
  id: string;
  name: string;
}

interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  qrUrl: string | null;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
}

interface SendMessageResponse {
  buyerMessage: DirectMessage;
  aiMessage: DirectMessage;
}

export const InboxPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedSellerId = searchParams.get('sellerId');
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const isPrependingRef = useRef(false);

  useEffect(() => {
    let active = true;

    const fetchShops = async () => {
      try {
        const response = await apiClient.get<Shop[]>('/messages/shops');
        if (!active) return;

        setShops(response.data);
        setSelectedShopId((currentShopId) =>
          requestedSellerId &&
          response.data.some((shop) => shop.id === requestedSellerId)
            ? requestedSellerId
            : currentShopId &&
                response.data.some((shop) => shop.id === currentShopId)
            ? currentShopId
            : response.data[0]?.id ?? null,
        );
      } catch (requestError) {
        console.error('Lỗi khi tải danh sách shop:', requestError);
        if (active) setError('Không thể tải danh sách shop.');
      } finally {
        if (active) setLoadingShops(false);
      }
    };

    fetchShops();

    return () => {
      active = false;
    };
  }, [requestedSellerId]);

  useEffect(() => {
    if (!selectedShopId) {
      setMessages([]);
      setHasMore(false);
      return;
    }

    let active = true;

    const fetchConversation = async () => {
      setLoadingMessages(true);
      setError('');

      try {
        // Chỉ tải 5 tin nhắn mới nhất
        const response = await apiClient.get<DirectMessage[]>(
          `/messages/conversations/${selectedShopId}?limit=5&skip=0`,
        );
        if (active) {
          setMessages(response.data);
          setHasMore(response.data.length === 5);
        }
      } catch (requestError) {
        console.error('Lỗi khi tải lịch sử trò chuyện:', requestError);
        if (active) setError('Không thể tải lịch sử trò chuyện.');
      } finally {
        if (active) setLoadingMessages(false);
      }
    };

    fetchConversation();

    return () => {
      active = false;
    };
  }, [selectedShopId]);

  const handleLoadMore = async () => {
    if (!selectedShopId || loadingMore || !hasMore) return;

    if (scrollContainerRef.current) {
      prevScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
    }
    setLoadingMore(true);

    try {
      const response = await apiClient.get<DirectMessage[]>(
        `/messages/conversations/${selectedShopId}?limit=5&skip=${messages.length}`,
      );
      if (response.data.length > 0) {
        isPrependingRef.current = true;
        setMessages((prev) => [...response.data, ...prev]);
      }
      if (response.data.length < 5) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Lỗi khi tải thêm tin nhắn cũ:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (container.scrollTop <= 40 && hasMore && !loadingMore && !loadingMessages) {
      handleLoadMore();
    }
  };

  useLayoutEffect(() => {
    if (isPrependingRef.current && scrollContainerRef.current) {
      const newScrollHeight = scrollContainerRef.current.scrollHeight;
      const diff = newScrollHeight - prevScrollHeightRef.current;
      scrollContainerRef.current.scrollTop = diff;
      isPrependingRef.current = false;
      return;
    }

    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    const message = inputText.trim();
    if (!selectedShopId || !message || sending) return;

    setSending(true);
    setError('');

    try {
      const response = await apiClient.post<SendMessageResponse>(
        '/messages/conversations',
        { sellerId: selectedShopId, message },
      );

      setMessages((currentMessages) => [
        ...currentMessages,
        response.data.buyerMessage,
        response.data.aiMessage,
      ]);
      setInputText('');
    } catch (requestError) {
      console.error('Lỗi khi gửi tin nhắn:', requestError);
      setError('Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  const selectedShop = shops.find((shop) => shop.id === selectedShopId);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper
        elevation={2}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Header Banner - Tông màu Navy hiện đại đồng bộ với Navbar */}
        <Box
          sx={{
            p: 3,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Avatar
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.12)',
              width: 52,
              height: 52,
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <ForumOutlinedIcon sx={{ color: '#60a5fa', fontSize: 30 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
              Hộp thư Trao đổi & Đơn hàng
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.3 }}>
              Xem nội dung tư vấn sản phẩm và hóa đơn thanh toán VietQR từ các Shop
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            minHeight: '65vh',
            height: { md: '65vh' },
            bgcolor: '#f8fafc',
          }}
        >
          {/* Cột trái: Danh sách các Shop */}
          <Box
            sx={{
              width: { xs: '100%', md: 300 },
              bgcolor: 'white',
              borderRight: { md: '1px solid #e2e8f0' },
              borderBottom: { xs: '1px solid #e2e8f0', md: 'none' },
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                px: 2.5,
                pt: 2.5,
                pb: 1,
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                fontSize: '0.75rem',
              }}
            >
              Kênh trò chuyện
            </Typography>

            {loadingShops ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={28} sx={{ color: '#2563eb' }} />
              </Box>
            ) : shops.length === 0 ? (
              <Typography color="text.secondary" sx={{ p: 2.5, fontSize: '0.9rem' }}>
                Chưa có cuộc trò chuyện nào.
              </Typography>
            ) : (
              <List disablePadding sx={{ mt: 0.5 }}>
                {shops.map((shop) => {
                  const isSelected = selectedShopId === shop.id;
                  return (
                    <React.Fragment key={shop.id}>
                      <ListItemButton
                        selected={isSelected}
                        disabled={sending}
                        onClick={() => setSelectedShopId(shop.id)}
                        sx={{
                          py: 1.8,
                          px: 2.5,
                          borderLeft: isSelected ? '4px solid #2563eb' : '4px solid transparent',
                          bgcolor: isSelected ? '#f1f5f9' : 'transparent',
                          '&:hover': {
                            bgcolor: isSelected ? '#f1f5f9' : '#f8fafc',
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: isSelected ? '#1e293b' : '#64748b',
                              fontWeight: 600,
                              fontSize: '0.95rem',
                            }}
                          >
                            {shop.name.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography
                              sx={{
                                fontWeight: isSelected ? 700 : 500,
                                color: '#1e293b',
                                fontSize: '0.95rem',
                              }}
                            >
                              {shop.name}
                            </Typography>
                          }
                          secondary={
                            <Typography
                              variant="caption"
                              sx={{ color: '#64748b' }}
                            >
                              Kênh tư vấn & nổ đơn
                            </Typography>
                          }
                        />
                      </ListItemButton>
                      <Divider sx={{ borderColor: '#f1f5f9' }} />
                    </React.Fragment>
                  );
                })}
              </List>
            )}
          </Box>

          {/* Cột phải: Khung hội thoại */}
          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {selectedShop ? (
              <>
                {/* Header chi tiết Shop */}
                <Box
                  sx={{
                    p: 2,
                    px: 3,
                    bgcolor: 'white',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      sx={{
                        bgcolor: '#1e293b',
                        width: 42,
                        height: 42,
                        fontWeight: 600,
                      }}
                    >
                      {selectedShop.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
                        {selectedShop.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box component="span" sx={{ width: 7, height: 7, bgcolor: '#10b981', borderRadius: '50%' }} />
                        Trợ lý AI sẵn sàng hỗ trợ
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label="Kênh chính thức"
                    size="small"
                    sx={{
                      bgcolor: '#eff6ff',
                      color: '#1d4ed8',
                      fontWeight: 600,
                      border: '1px solid #dbeafe',
                    }}
                  />
                </Box>

                {/* Danh sách tin nhắn */}
                <Box
                  ref={scrollContainerRef}
                  onScroll={handleScroll}
                  sx={{
                    flex: 1,
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    overflowY: 'auto',
                    minHeight: 0,
                    maxHeight: { xs: '50vh', md: 'none' },
                    bgcolor: '#f8fafc',
                  }}
                >
                  {error && <Alert severity="error">{error}</Alert>}

                  {loadingMessages ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                      <CircularProgress sx={{ color: '#2563eb' }} />
                    </Box>
                  ) : messages.length === 0 ? (
                    <Box sx={{ textAlign: 'center', mt: 8 }}>
                      <Typography color="text.secondary" sx={{ fontSize: '0.95rem' }}>
                        Chưa có tin nhắn nào trong cuộc trò chuyện này.
                      </Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                        Các phản hồi của AI và mã thanh toán VietQR sẽ hiển thị tại đây.
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      {hasMore && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                          <Button
                            size="small"
                            variant="text"
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            sx={{ color: '#2563eb' }}
                          >
                            {loadingMore ? (
                              <CircularProgress size={20} sx={{ color: '#2563eb' }} />
                            ) : (
                              'Tải tin nhắn cũ'
                            )}
                          </Button>
                        </Box>
                      )}
                      {!hasMore && messages.length >= 5 && (
                        <Typography
                          variant="caption"
                          align="center"
                          sx={{ color: '#94a3b8', fontStyle: 'italic', display: 'block', my: 0.5 }}
                        >
                          Đầu cuộc trò chuyện
                        </Typography>
                      )}
                      {messages.map((message) => {
                      const isBuyerMessage = message.senderId === user?.id;

                      return (
                        <Box
                          key={message.id}
                          sx={{
                            display: 'flex',
                            justifyContent: isBuyerMessage
                              ? 'flex-end'
                              : 'flex-start',
                          }}
                        >
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              maxWidth: { xs: '85%', md: '70%' },
                              bgcolor: isBuyerMessage ? '#eff6ff' : 'white',
                              border: '1px solid',
                              borderColor: isBuyerMessage ? '#bfdbfe' : '#e2e8f0',
                              borderRadius: isBuyerMessage
                                ? '16px 16px 4px 16px'
                                : '16px 16px 16px 4px',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 700,
                                color: isBuyerMessage ? '#1d4ed8' : '#475569',
                                display: 'block',
                                mb: 0.5,
                              }}
                            >
                              {isBuyerMessage
                                ? 'Bạn'
                                : `${message.sender.name} (Shop / Trợ lý AI)`}
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

                            {/* Khối hiển thị mã thanh toán VietQR */}
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
                                  <Typography
                                    variant="subtitle2"
                                    sx={{ fontWeight: 700 }}
                                  >
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
                    })}
                    </>
                  )}
                  <div ref={chatEndRef} />
                </Box>

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
                    value={inputText}
                    disabled={sending}
                    placeholder={
                      sending
                        ? 'Trợ lý AI đang trả lời...'
                        : 'Nhập câu hỏi cho shop...'
                    }
                    onChange={(event) => setInputText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    slotProps={{ htmlInput: { maxLength: 1000 } }}
                  />
                  <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() || sending}
                    aria-label="Gửi tin nhắn"
                    sx={{ mb: 0.25 }}
                  >
                    {sending ? <CircularProgress size={24} /> : <SendIcon />}
                  </IconButton>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 4,
                }}
              >
                <Typography color="text.secondary">
                  Chọn một kênh bên trái để xem nội dung trao đổi.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default InboxPage;
