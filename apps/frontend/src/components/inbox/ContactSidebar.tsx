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
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import type { InboxContact } from './types';
import { surfaceTokens } from '../../theme';

interface ContactSidebarProps {
  title: string;
  itemSubtitle: string;
  emptyText: string;
  contacts: InboxContact[];
  selectedId: string | null;
  loading: boolean;
  disabled: boolean;
  onSelect: (id: string) => void;
}

export const ContactSidebar: React.FC<ContactSidebarProps> = ({
  title,
  itemSubtitle,
  emptyText,
  contacts,
  selectedId,
  loading,
  disabled,
  onSelect,
}) => (
  <Box
    sx={{
      width: { xs: '100%', md: 320 },
      flexShrink: 0,
      bgcolor: 'background.paper',
      borderRight: { md: '1px solid' },
      borderColor: 'divider',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      overflowY: 'auto',
    }}
  >
    <Box
      sx={{
        px: 2.5,
        py: 1.75,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 0,
        zIndex: 1,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {title}
      </Typography>
    </Box>

    {loading ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={28} />
      </Box>
    ) : contacts.length === 0 ? (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ p: 3, textAlign: 'center' }}
      >
        {emptyText}
      </Typography>
    ) : (
      <List disablePadding>
        {contacts.map((contact) => {
          const isSelected = selectedId === contact.id;
          return (
            <React.Fragment key={contact.id}>
              <ListItemButton
                selected={isSelected}
                disabled={disabled}
                onClick={() => onSelect(contact.id)}
                sx={{
                  minHeight: 64,
                  py: 1.5,
                  px: 2,
                  gap: 0.5,
                  borderLeft: '3px solid',
                  borderLeftColor: isSelected ? 'primary.main' : 'transparent',
                  bgcolor: isSelected ? surfaceTokens.primarySoft : 'transparent',
                  '&.Mui-selected': {
                    bgcolor: surfaceTokens.primarySoft,
                  },
                  '&.Mui-selected:hover, &:hover': {
                    bgcolor: isSelected
                      ? surfaceTokens.primarySoft
                      : surfaceTokens.mutedBg,
                  },
                }}
              >
                <ListItemAvatar sx={{ minWidth: 48 }}>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: isSelected ? 'primary.main' : '#475569',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                    }}
                  >
                    {contact.name.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  sx={{ minWidth: 0, my: 0 }}
                  primary={
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{
                        fontWeight: isSelected ? 700 : 600,
                        color: 'text.primary',
                      }}
                    >
                      {contact.name}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{ color: 'text.secondary', display: 'block' }}
                    >
                      {itemSubtitle}
                    </Typography>
                  }
                />
                {contact.unreadCount > 0 && (
                  <Box
                    aria-label={`${contact.unreadCount} tin nhắn chưa đọc`}
                    sx={{
                      minWidth: 24,
                      height: 24,
                      px: 0.75,
                      borderRadius: 12,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                  </Box>
                )}
                <ChevronRightRoundedIcon
                  sx={{
                    display: { xs: 'block', md: 'none' },
                    color: 'text.secondary',
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                />
              </ListItemButton>
              <Divider sx={{ borderColor: surfaceTokens.mutedBg }} />
            </React.Fragment>
          );
        })}
      </List>
    )}
  </Box>
);

