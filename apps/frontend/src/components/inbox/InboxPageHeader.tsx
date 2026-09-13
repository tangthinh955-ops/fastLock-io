import React from 'react';
import { Avatar, Box, Typography } from '@mui/material';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';

interface InboxPageHeaderProps {
  title: string;
  description: string;
}

export const InboxPageHeader: React.FC<InboxPageHeaderProps> = ({
  title,
  description,
}) => (
  <Box
    sx={{
      p: 3,
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
    }}
  >
    <Avatar
      sx={{
        bgcolor: 'rgba(255, 255, 255, 0.12)',
        width: 52,
        height: 52,
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}
    >
      <ForumOutlinedIcon sx={{ color: '#60a5fa', fontSize: 30 }} />
    </Avatar>
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.3 }}>
        {description}
      </Typography>
    </Box>
  </Box>
);
