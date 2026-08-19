import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Divider,
  Stack
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Chuyển hướng sau khi đăng nhập dựa theo Role
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (savedUser.role === 'ADMIN') navigate('/admin/dashboard');
      else if (savedUser.role === 'SELLER') navigate('/seller/dashboard');
      else navigate('/viewer');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Kiểm tra lại thông tin!');
    } finally {
      setLoading(false);
    }
  };

  // Hàm chọn nhanh tài khoản mẫu
  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('123456');
  };

  return (
    <Container maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={6} sx={{ p: 4, width: '100%', borderRadius: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
          ⚡ LiveOrder Login
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Hệ thống Chốt đơn Livestream tự động
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            variant="outlined"
            margin="normal"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
          />
          <TextField
            fullWidth
            label="Mật khẩu"
            type="password"
            variant="outlined"
            margin="normal"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 2, py: 1.2, fontWeight: 'bold' }}
          >
            {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }}>HOẶC TEST NHANH</Divider>

        <Stack spacing={1}>
          <Button variant="outlined" color="error" size="small" onClick={() => handleQuickFill('admin@liveorder.com')}>
            Vào vai: System ADMIN
          </Button>
          <Button variant="outlined" color="warning" size="small" onClick={() => handleQuickFill('seller@liveorder.com')}>
            Vào vai: Chủ Shop SELLER
          </Button>
          <Button variant="outlined" color="info" size="small" onClick={() => handleQuickFill('buyer@liveorder.com')}>
            Vào vai: Khách hàng BUYER
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};
