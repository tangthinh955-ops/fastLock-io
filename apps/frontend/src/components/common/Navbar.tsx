import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LiveTvOutlinedIcon from '@mui/icons-material/LiveTvOutlined';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, type Role } from '../../context/AuthContext';
import { surfaceTokens } from '../../theme';
import { ROLE_HOME, getRoleMeta } from '../../utils/roleConfig';
import {
  MobileNavDrawer,
  getNavItemStyle,
  type NavItem,
} from './MobileNavDrawer';

const ROLE_NAV_ITEMS: Record<Role, NavItem[]> = {
  ADMIN: [
    {
      label: 'Quản trị',
      path: '/admin/dashboard',
      icon: <AdminPanelSettingsOutlinedIcon fontSize="small" />,
    },
  ],
  SELLER: [
    {
      label: 'Sản phẩm & Đơn',
      path: '/seller/dashboard',
      icon: <Inventory2OutlinedIcon fontSize="small" />,
    },
    {
      label: 'Live Studio',
      path: '/seller/live-studio',
      icon: <VideocamOutlinedIcon fontSize="small" />,
      isLive: true,
    },
    {
      label: 'Kho kiến thức',
      path: '/seller/ai-settings',
      icon: <MenuBookOutlinedIcon fontSize="small" />,
    },
    {
      label: 'Tin nhắn khách',
      path: '/seller/inbox',
      icon: <ChatBubbleOutlineRoundedIcon fontSize="small" />,
    },
  ],
  BUYER: [
    {
      label: 'Xem Live',
      path: '/viewer',
      icon: <LiveTvOutlinedIcon fontSize="small" />,
    },
    {
      label: 'Hộp thư',
      path: '/inbox',
      icon: <ForumOutlinedIcon fontSize="small" />,
    },
  ],
};

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isAuthPage =
    location.pathname === '/login' || location.pathname === '/register';
  if (!user || isAuthPage) return null;

  const navItems = ROLE_NAV_ITEMS[user.role] ?? [];
  const activeItem = navItems.find((item) => location.pathname === item.path);
  const roleBadge = getRoleMeta(user.role);

  const handleNavigate = (path: string) => {
    setDrawerOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setDrawerOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <>
      <AppBar
        position="sticky"
        color="inherit"
        sx={{
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 56, md: 64 },
            px: { xs: 1.5, sm: 2.5, md: 3 },
            gap: { xs: 1, md: 2 },
            maxWidth: 1440,
            width: '100%',
            mx: 'auto',
          }}
        >
          <Box
            component="button"
            type="button"
            onClick={() => handleNavigate(ROLE_HOME[user.role])}
            aria-label="Về trang chính LiveOrder"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              border: 0,
              bgcolor: 'transparent',
              p: 0.5,
              borderRadius: 1.5,
              cursor: 'pointer',
              color: 'text.primary',
              minHeight: 44,
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <BoltRoundedIcon fontSize="small" />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.05rem', sm: '1.15rem' },
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
              }}
            >
              LiveOrder
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          <Stack
            direction="row"
            spacing={0.75}
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              flex: 1,
              minWidth: 0,
              ml: 1,
            }}
          >
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const itemStyle = getNavItemStyle(isActive, item.isLive);
              return (
                <Button
                  key={item.path}
                  startIcon={item.icon}
                  onClick={() => handleNavigate(item.path)}
                  aria-current={isActive ? 'page' : undefined}
                  sx={{
                    px: 1.75,
                    py: 0.75,
                    whiteSpace: 'nowrap',
                    bgcolor: itemStyle.bgcolor,
                    color: itemStyle.color,
                    '&:hover': {
                      bgcolor: itemStyle.hoverBgcolor,
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Stack>

          {/* Mobile Active Page Indicator */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              flex: 1,
              minWidth: 0,
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 1,
            }}
          >
            {activeItem && (
              <Chip
                label={activeItem.label}
                size="small"
                sx={{
                  maxWidth: 150,
                  bgcolor: activeItem.isLive
                    ? surfaceTokens.liveRedSoft
                    : surfaceTokens.mutedBg,
                  color: activeItem.isLive
                    ? surfaceTokens.liveRedText
                    : 'text.primary',
                }}
              />
            )}
            <IconButton
              aria-label="Mở menu điều hướng"
              onClick={() => setDrawerOpen(true)}
              edge="end"
              sx={{ color: 'text.primary' }}
            >
              <MenuRoundedIcon />
            </IconButton>
          </Box>

          {/* Desktop User Info & Logout */}
          <Stack
            direction="row"
            spacing={1.25}
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <Typography
              variant="body2"
              noWrap
              sx={{
                fontWeight: 600,
                maxWidth: 160,
                color: 'text.primary',
              }}
              title={user.name}
            >
              {user.name}
            </Typography>
            <Chip
              label={roleBadge.label}
              size="small"
              sx={{
                bgcolor: roleBadge.bg,
                color: roleBadge.color,
                fontSize: '0.75rem',
              }}
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<LogoutRoundedIcon fontSize="small" />}
              onClick={handleLogout}
              sx={{
                borderColor: 'divider',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: surfaceTokens.borderStrong,
                  bgcolor: surfaceTokens.mutedBg,
                },
              }}
            >
              Đăng xuất
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <MobileNavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        navItems={navItems}
        currentPathname={location.pathname}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
    </>
  );
};
