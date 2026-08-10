import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

export const SellerDashboard: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" color="warning.main" gutterBottom sx={{ fontWeight: 'bold' }}>
          🏪 SELLER DASHBOARD & LIVE STUDIO
        </Typography>
        <Typography variant="body1">
          Giao diện dành riêng cho Chủ shop (Seller). Nơi tạo sản phẩm và phát Livestream WebCam (Dev 2 - Kỳ phụ trách).
        </Typography>
        <Box sx={{ mt: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
          <Typography variant="body2" color="primary">
            ⏳ Đang chờ Dev 2 (Kỳ) code ở Phase 1...
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};
