import React from 'react';
import { Avatar, Box, Chip, IconButton, Typography } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { surfaceTokens } from '../../theme';

interface ChatHeaderProps {
  name: string;
  statusText: string;
  isAiMode?: boolean;
  badgeLabel?: string;
  actions?: React.ReactNode;
  onBack?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  name,
  statusText,
  isAiMode = false,
  badgeLabel,
  actions,
  onBack,
}) => (
  <Box
    sx={{
      px: { xs: 1.25, sm: 2.5 },
      py: { xs: 1.25, sm: 1.75 },
      bgcolor: 'background.paper',
      borderBottom: '1px solid',
      borderColor: 'divider',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 1,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
      {onBack && (
        <IconButton
          onClick={onBack}
          aria-label="Quay lại danh sách"
          sx={{
            display: { xs: 'inline-flex', md: 'none' },
            color: 'text.primary',
            flexShrink: 0,
          }}
        >
          <ArrowBackRoundedIcon />
        </IconButton>
      )}
      <Avatar
        sx={{
          bgcolor: '#0F172A',
          width: 40,
          height: 40,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {name.charAt(0).toUpperCase()}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          noWrap
          sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1rem' }}
        >
          {name}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: isAiMode ? surfaceTokens.successText : 'primary.main',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
          }}
        >
          <Box
            component="span"
            sx={{
              width: 7,
              height: 7,
              bgcolor: isAiMode ? '#10B981' : 'primary.main',
              borderRadius: '50%',
              flexShrink: 0,
            }}
          />
          {statusText}
        </Typography>
      </Box>
    </Box>
    {(badgeLabel || actions) && (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
          flexShrink: 0,
        }}
      >
        {badgeLabel && (
          <Chip
            label={badgeLabel}
            size="small"
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              bgcolor: surfaceTokens.primarySoft,
              color: 'primary.main',
              border: `1px solid ${surfaceTokens.primaryBorder}`,
            }}
          />
        )}
        {actions}
      </Box>
    )}
  </Box>
);
