import React from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import type { User } from '../../context/AuthContext';
import { surfaceTokens } from '../../theme';
import { getRoleMeta } from '../../utils/roleConfig';

export interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  isLive?: boolean;
}

export const getNavItemStyle = (isActive: boolean, isLive?: boolean) => {
  if (isActive) {
    return {
      bgcolor: isLive ? surfaceTokens.liveRedSoft : surfaceTokens.primarySoft,
      color: isLive ? surfaceTokens.liveRedText : 'primary.main',
      iconColor: isLive ? surfaceTokens.liveRed : 'primary.main',
      hoverBgcolor: isLive ? surfaceTokens.liveRedSoft : surfaceTokens.primarySoft,
    };
  }

  return {
    bgcolor: 'transparent',
    color: isLive ? surfaceTokens.liveRedText : 'text.secondary',
    iconColor: isLive ? surfaceTokens.liveRedText : 'text.secondary',
    hoverBgcolor: isLive ? surfaceTokens.liveRedSoft : surfaceTokens.mutedBg,
  };
};

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
  user: User;
  navItems: NavItem[];
  currentPathname: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  open,
  onClose,
  user,
  navItems,
  currentPathname,
  onNavigate,
  onLogout,
}) => {
  const roleBadge = getRoleMeta(user.role);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: 290,
            maxWidth: '85vw',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: 'primary.main',
              fontWeight: 700,
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700 }}>
              {user.name}
            </Typography>
            <Chip
              label={roleBadge.label}
              size="small"
              sx={{
                mt: 0.25,
                height: 22,
                bgcolor: roleBadge.bg,
                color: roleBadge.color,
                fontSize: '0.75rem',
              }}
            />
          </Box>
        </Stack>
        <IconButton aria-label="Đóng menu điều hướng" onClick={onClose}>
          <CloseRoundedIcon />
        </IconButton>
      </Box>

      <List sx={{ flex: 1, p: 1.5 }}>
        {navItems.map((item) => {
          const isActive = currentPathname === item.path;
          const itemStyle = getNavItemStyle(isActive, item.isLive);
          return (
            <ListItemButton
              key={item.path}
              selected={isActive}
              onClick={() => onNavigate(item.path)}
              sx={{
                borderRadius: 2,
                minHeight: 48,
                mb: 0.75,
                bgcolor: itemStyle.bgcolor,
                color: isActive ? itemStyle.color : 'text.primary',
                '&:hover': {
                  bgcolor: itemStyle.hoverBgcolor,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: itemStyle.iconColor }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    sx: {
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.95rem',
                    },
                  },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Divider />
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<LogoutRoundedIcon />}
          onClick={onLogout}
          sx={{ minHeight: 48 }}
        >
          Đăng xuất
        </Button>
      </Box>
    </Drawer>
  );
};

