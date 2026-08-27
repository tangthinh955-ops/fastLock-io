import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'error';
      case 'SELLER': return 'warning';
      default: return 'info';
    }
  };

  return (
    <AppBar position="static" sx={{ background: '#1a1a2e' }}>
      <Toolbar>
        <Typography 
          variant="h6" 
          sx={{ flexGrow: 1, fontWeight: 'bold', letterSpacing: 1, cursor: 'pointer' }}
          onClick={() => navigate(user.role === 'ADMIN' ? '/admin/dashboard' : user.role === 'SELLER' ? '/seller/dashboard' : '/viewer')}
        >
          ⚡ LIVEORDER ENGINE
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {user.role === 'SELLER' && (
            <Button color="inherit" onClick={() => navigate('/seller/ai-settings')} variant="text" size="small">
              Cấu hình AI
            </Button>
          )}
          <Typography variant="body2">{user.name}</Typography>
          <Chip label={user.role} color={getRoleColor(user.role)} size="small" />
          <Button color="inherit" onClick={handleLogout} variant="outlined" size="small">
            Đăng xuất
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
