import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

export const ViewerPage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
          📺 BUYER LIVE VIEWER
        </Typography>
        <Typography variant="body1">
          Giao diện Khách hàng (Buyer) xem Livestream + Khung Chat tự động tư vấn AI (Dev 1 phụ trách).
        </Typography>
        <Box sx={{ mt: 3, p: 2, bgcolor: '#e8f5e9', borderRadius: 1 }}>
          <Typography variant="body2" color="success.main">
            ⏳ Đang chờ code ở Phase 1...
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};
