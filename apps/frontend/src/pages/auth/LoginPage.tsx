import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth, type Role } from '../../context/AuthContext';
import { surfaceTokens } from '../../theme';
import { ROLE_HOME } from '../../utils/roleConfig';

const QUICK_FILL_ACCOUNTS = [
  {
    label: 'Dùng thử: Chủ Shop (Seller)',
    email: 'seller@liveorder.com',
    color: 'warning' as const,
  },
  {
    label: 'Dùng thử: Khách hàng (Buyer)',
    email: 'buyer@liveorder.com',
    color: 'primary' as const,
  },
  {
    label: 'Dùng thử: Quản trị (Admin)',
    email: 'admin@liveorder.com',
    color: 'error' as const,
  },
];

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  if (!isLoading && isAuthenticated && user) {
    return <Navigate to={ROLE_HOME[user.role] ?? ROLE_HOME.BUYER} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}') as { role?: Role };
      const targetRoute = savedUser.role ? ROLE_HOME[savedUser.role] : ROLE_HOME.BUYER;
      navigate(targetRoute ?? ROLE_HOME.BUYER);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(
        apiErr.response?.data?.message ||
          'Đăng nhập thất bại. Vui lòng kiểm tra thông tin và đảm bảo Backend đã chạy.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('123456');
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
        py: { xs: 3, sm: 4 },
      }}
    >
      <Container maxWidth="xs" disableGutters>
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 3, sm: 4 },
            width: '100%',
            borderRadius: 4,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'grid',
                placeItems: 'center',
                mb: 0.5,
              }}
            >
              <BoltRoundedIcon />
            </Box>
            <Typography
              component="h1"
              variant="h5"
              sx={{ fontWeight: 800, color: 'text.primary' }}
            >
              Đăng nhập LiveOrder
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Hệ thống Chốt đơn Livestream &amp; Tư vấn AI
            </Typography>
          </Stack>

          {error && (
            <Alert severity="error" role="alert" sx={{ mb: 2.5, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                autoComplete="email"
                variant="outlined"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEmail(e.target.value)
                }
                required
              />
              <TextField
                fullWidth
                label="Mật khẩu"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                variant="outlined"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                required
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 0.5, minHeight: 48, fontWeight: 700 }}
              >
                {loading ? 'Đang xác thực...' : 'Đăng nhập'}
              </Button>
            </Stack>
          </Box>

          <Stack
            direction="row"
            spacing={0.5}
            sx={{
              mt: 2,
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Chưa có tài khoản?
            </Typography>
            <Button
              type="button"
              variant="text"
              onClick={() => navigate('/register')}
              sx={{ minHeight: 44, fontWeight: 700 }}
            >
              Đăng ký tài khoản mới
            </Button>
          </Stack>

          <Divider sx={{ mt: 2, mb: 2.5, color: 'text.secondary', fontSize: '0.75rem' }}>
            Tài khoản dùng thử nhanh
          </Divider>

          <Box
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              bgcolor: surfaceTokens.pageBg,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack spacing={1}>
              {QUICK_FILL_ACCOUNTS.map((account) => (
                <Button
                  key={account.email}
                  variant="outlined"
                  color={account.color}
                  size="small"
                  fullWidth
                  onClick={() => handleQuickFill(account.email)}
                  sx={{ minHeight: 44, justifyContent: 'center' }}
                >
                  {account.label}
                </Button>
              ))}
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
