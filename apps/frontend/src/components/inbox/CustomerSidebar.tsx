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

interface CustomerSidebarProps {
  customers: InboxContact[];
  selectedCustomerId: string | null;
  loading: boolean;
  disabled: boolean;
  onSelect: (customerId: string) => void;
}

export const CustomerSidebar: React.FC<CustomerSidebarProps> = ({
  customers,
  selectedCustomerId,
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
    <Typography sx={{ px: 2.5, pt: 2.5, fontWeight: 700 }}>
      Khách đã nhắn tin
    </Typography>

    {loading ? (
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
              disabled={disabled}
              onClick={() => onSelect(customer.id)}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: '#334155' }}>
                  {customer.name.charAt(0).toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={customer.name} secondary="Khách hàng" />
              {customer.unreadCount > 0 && (
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
                  {customer.unreadCount > 99 ? '99+' : customer.unreadCount}
                </Box>
              )}
            </ListItemButton>
            <Divider />
          </React.Fragment>
        ))}
      </List>
    )}
  </Box>
);
