import React from 'react';
import { Box, Typography } from '@mui/material';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import { surfaceTokens } from '../../theme';

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
      px: { xs: 2, sm: 3 },
      py: { xs: 1.75, sm: 2.25 },
      bgcolor: 'background.paper',
      borderBottom: '1px solid',
      borderColor: 'divider',
      display: 'flex',
      alignItems: 'center',
      gap: 1.75,
    }}
  >
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: 2.5,
        bgcolor: surfaceTokens.primarySoft,
        color: 'primary.main',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      <ForumOutlinedIcon />
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography
        component="h1"
        variant="h6"
        sx={{
          fontWeight: 700,
          fontSize: { xs: '1.05rem', sm: '1.25rem' },
          color: 'text.primary',
        }}
      >
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
  </Box>
);
