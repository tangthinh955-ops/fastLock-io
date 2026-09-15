import React from 'react';
import { Avatar, Box, Chip, Typography } from '@mui/material';

interface ChatHeaderProps {
  name: string;
  statusText: string;
  badgeLabel?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  name,
  statusText,
  badgeLabel,
}) => (
  <Box
    sx={{
      p: 2,
      px: 3,
      bgcolor: 'white',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Avatar
        sx={{
          bgcolor: '#1e293b',
          width: 42,
          height: 42,
          fontWeight: 600,
        }}
      >
        {name.charAt(0).toUpperCase()}
      </Avatar>
      <Box>
        <Typography
          sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}
        >
          {name}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <Box
            component="span"
            sx={{
              width: 7,
              height: 7,
              bgcolor: '#10b981',
              borderRadius: '50%',
            }}
          />
          {statusText}
        </Typography>
      </Box>
    </Box>
    {badgeLabel && (
      <Chip
        label={badgeLabel}
        size="small"
        sx={{
          bgcolor: '#eff6ff',
          color: '#1d4ed8',
          fontWeight: 600,
          border: '1px solid #dbeafe',
        }}
      />
    )}
  </Box>
);
