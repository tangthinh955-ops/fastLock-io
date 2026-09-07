import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
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
import SendIcon from '@mui/icons-material/Send';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface Customer {
  id: string;
  name: string;
}

interface DirectMessage {
  id: string;
  senderId: string;
  content: string;
  qrUrl: string | null;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
}

export const SellerInboxPage: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
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

    const fetchCustomers = async () => {
      try {
        const response = await apiClient.get<Customer[]>(
          '/messages/seller/customers',
        );
        if (!active) return;

        setCustomers(response.data);
        setSelectedCustomerId(response.data[0]?.id ?? null);
      } catch (requestError) {
        console.error('Lỗi khi tải danh sách khách hàng:', requestError);
        if (active) setError('Không thể tải danh sách khách hàng.');
      } finally {
        if (active) setLoadingCustomers(false);
      }
    };

    fetchCustomers();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCustomerId) {
      setMessages([]);
      setHasMore(false);
      return;
    }

    let active = true;

    const fetchConversation = async () => {
      setLoadingMessages(true);
      setError('');

      try {
        // Tải 5 tin nhắn mới nhất
        const response = await apiClient.get<DirectMessage[]>(
          `/messages/seller/conversations/${selectedCustomerId}?limit=5&skip=0`,
        );
        if (active) {
          setMessages(response.data);
          setHasMore(response.data.length === 5);
        }
      } catch (requestError) {
        console.error('Lỗi khi tải cuộc trò chuyện:', requestError);
        if (active) setError('Không thể tải cuộc trò chuyện.');
      } finally {
        if (active) setLoadingMessages(false);
      }
    };

    fetchConversation();

    return () => {
      active = false;
    };
  }, [selectedCustomerId]);

  const handleLoadMore = async () => {
    if (!selectedCustomerId || loadingMore || !hasMore) return;

    if (scrollContainerRef.current) {
      prevScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
    }
    setLoadingMore(true);

    try {
      const response = await apiClient.get<DirectMessage[]>(
        `/messages/seller/conversations/${selectedCustomerId}?limit=5&skip=${messages.length}`,
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
    const buyerId = selectedCustomerId;
    if (!buyerId || !message || sending) return;

    setSending(true);
    setError('');

    try {
      const response = await apiClient.post<DirectMessage>(
        '/messages/seller/conversations',
        { buyerId, message },
      );

      setMessages((currentMessages) => [...currentMessages, response.data]);
      setInputText('');
    } catch (requestError) {
      console.error('Lỗi khi gửi tin nhắn cho khách hàng:', requestError);
      setError('Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  const selectedCustomer = customers.find(
    (customer) => customer.id === selectedCustomerId,
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper
        elevation={2}
        sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0' }}
      >
        <Box
          sx={{
            p: 3,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          }}
        >
          <ForumOutlinedIcon fontSize="large" />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Tin nhắn khách hàng
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              Kiểm tra các cuộc trò chuyện giữa khách và trợ lý AI của shop.
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
          <Box
            sx={{
              width: { xs: '100%', md: 300 },
              bgcolor: 'white',
              borderRight: { md: '1px solid #e2e8f0' },
              borderBottom: { xs: '1px solid #e2e8f0', md: 'none' },
            }}
          >
            <Typography sx={{ px: 2.5, pt: 2.5, fontWeight: 700 }}>
              Khách đã nhắn tin
            </Typography>

            {loadingCustomers ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : customers.length === 0 ? (
              <Typography color="text.secondary" sx={{ p: 2.5 }}>
                Chưa có khách hàng nào nhắn tin.
              </Typography>
            ) : (
              <List disablePadding sx={{ mt: 1 }}>
                {customers.map((customer) => (
                  <React.Fragment key={customer.id}>
                    <ListItemButton
                      selected={selectedCustomerId === customer.id}
                      disabled={sending}
                      onClick={() => setSelectedCustomerId(customer.id)}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#334155' }}>
                          {customer.name.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={customer.name} secondary="Khách hàng" />
                    </ListItemButton>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>

          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {selectedCustomer ? (
              <>
                <Box sx={{ p: 2, bgcolor: 'white', borderBottom: '1px solid #e2e8f0' }}>
                  <Typography sx={{ fontWeight: 700 }}>
                    {selectedCustomer.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Lịch sử Buyer ↔ Shop
                  </Typography>
                </Box>

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
                  }}
                >
                  {error && <Alert severity="error">{error}</Alert>}

                  {loadingMessages ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                      <CircularProgress sx={{ color: '#2563eb' }} />
                    </Box>
                  ) : messages.length === 0 ? (
                    <Typography color="text.secondary" align="center" sx={{ mt: 6 }}>
                      Chưa có tin nhắn với khách hàng này.
                    </Typography>
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
                        const isShopMessage = message.senderId === user?.id;

                        return (
                          <Box
                            key={message.id}
                            sx={{
                              display: 'flex',
                              justifyContent: isShopMessage ? 'flex-end' : 'flex-start',
                            }}
                          >
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 1.5,
                                maxWidth: '75%',
                                bgcolor: isShopMessage ? '#eff6ff' : 'white',
                              }}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                {isShopMessage
                                  ? 'Shop / Trợ lý AI'
                                  : message.sender.name}
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
                                <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5 }}>
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
                    placeholder="Nhập tin nhắn trả lời khách hàng..."
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
                    aria-label="Gửi tin nhắn cho khách hàng"
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
                  Chọn một khách hàng để xem lịch sử trò chuyện.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default SellerInboxPage;
