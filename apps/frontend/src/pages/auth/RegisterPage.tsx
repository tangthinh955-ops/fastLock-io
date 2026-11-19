import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { surfaceTokens } from '../../theme';
import { ROLE_HOME } from '../../utils/roleConfig';

type RegisterRole = 'BUYER' | 'SELLER';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<RegisterRole>('BUYER');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError('Vui lòng nhập họ và tên.');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: trimmedName,
        email: trimmedEmail,
        password,
        role,
      });
      navigate(ROLE_HOME[role]);
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const rawMessage = apiErr.response?.data?.message;
      const apiMessage = Array.isArray(rawMessage)
        ? rawMessage.join(' ')
        : rawMessage;
      setError(
        apiMessage ||
          'Đăng ký thất bại. Vui lòng kiểm tra thông tin và đảm bảo Backend đã chạy.',
      );
    } finally {
      setLoading(false);
    }
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
              Đăng ký tài khoản LiveOrder
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Chọn vai trò để bắt đầu mua sắm hoặc mở phiên livestream
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
                label="Họ và tên"
                type="text"
                autoComplete="name"
                variant="outlined"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
                required
              />

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
                autoComplete="new-password"
                variant="outlined"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                helperText="Tối thiểu 6 ký tự"
                required
                slotProps={{
                  htmlInput: { minLength: 6 },
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                          sx={{ minWidth: 44, minHeight: 44 }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                fullWidth
                label="Xác nhận mật khẩu"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                variant="outlined"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfirmPassword(e.target.value)
                }
                error={Boolean(confirmPassword && password !== confirmPassword)}
                helperText={
                  confirmPassword && password !== confirmPassword
                    ? 'Mật khẩu xác nhận không khớp'
                    : undefined
                }
                required
                slotProps={{
                  htmlInput: { minLength: 6 },
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={
                            showConfirmPassword
                              ? 'Ẩn mật khẩu xác nhận'
                              : 'Hiện mật khẩu xác nhận'
                          }
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          edge="end"
                          sx={{ minWidth: 44, minHeight: 44 }}
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  bgcolor: surfaceTokens.pageBg,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    fontWeight: 700,
                    color: 'text.secondary',
                    mb: 1,
                  }}
                >
                  Vai trò tài khoản
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button
                    type="button"
                    variant={role === 'BUYER' ? 'contained' : 'outlined'}
                    startIcon={<PersonOutlinedIcon />}
                    onClick={() => setRole('BUYER')}
                    aria-pressed={role === 'BUYER'}
                    sx={{
                      flex: 1,
                      minHeight: 44,
                      py: 1,
                      px: 1.25,
                      fontSize: '0.8125rem',
                      lineHeight: 1.3,
                      textAlign: 'left',
                      bgcolor: role === 'BUYER' ? undefined : surfaceTokens.cardBg,
                    }}
                  >
                    Khách mua hàng (BUYER)
                  </Button>
                  <Button
                    type="button"
                    variant={role === 'SELLER' ? 'contained' : 'outlined'}
                    startIcon={<StorefrontOutlinedIcon />}
                    onClick={() => setRole('SELLER')}
                    aria-pressed={role === 'SELLER'}
                    sx={{
                      flex: 1,
                      minHeight: 44,
                      py: 1,
                      px: 1.25,
                      fontSize: '0.8125rem',
                      lineHeight: 1.3,
                      textAlign: 'left',
                      bgcolor: role === 'SELLER' ? undefined : surfaceTokens.cardBg,
                    }}
                  >
                    Chủ Shop Livestream (SELLER)
                  </Button>
                </Stack>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 0.5, minHeight: 48, fontWeight: 700 }}
              >
                {loading ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              type="button"
              variant="text"
              fullWidth
              onClick={() => navigate('/login')}
              sx={{ minHeight: 44, fontWeight: 600 }}
            >
              Đã có tài khoản? Đăng nhập ngay
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
