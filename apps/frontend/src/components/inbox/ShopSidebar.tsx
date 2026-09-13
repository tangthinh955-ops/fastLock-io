import React from 'react';
import {
  Avatar,
  Box,
  CircularProgress,
  Divider,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import type { InboxContact } from './types';

interface ShopSidebarProps {
  shops: InboxContact[];
  selectedShopId: string | null;
  loading: boolean;
  disabled: boolean;
  onSelect: (shopId: string) => void;
}

export const ShopSidebar: React.FC<ShopSidebarProps> = ({
  shops,
  selectedShopId,
  loading,
  disabled,
  onSelect,
}) => (
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

    {loading ? (
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
                disabled={disabled}
                onClick={() => onSelect(shop.id)}
                sx={{
                  py: 1.8,
                  px: 2.5,
                  borderLeft: isSelected
                    ? '4px solid #2563eb'
                    : '4px solid transparent',
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
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Kênh tư vấn & nổ đơn
                    </Typography>
                  }
                />
                {shop.unreadCount > 0 && (
                  <Box
                    sx={{
                      minWidth: 24,
                      height: 24,
                      px: 0.75,
                      borderRadius: 12,
                      bgcolor: '#2563eb',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {shop.unreadCount > 99 ? '99+' : shop.unreadCount}
                  </Box>
                )}
              </ListItemButton>
              <Divider sx={{ borderColor: '#f1f5f9' }} />
            </React.Fragment>
          );
        })}
      </List>
    )}
  </Box>
);
