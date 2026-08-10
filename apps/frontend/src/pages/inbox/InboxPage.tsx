import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

export const InboxPage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" color="info.main" gutterBottom sx={{ fontWeight: 'bold' }}>
          📩 BUYER INBOX & VIETQR
        </Typography>
        <Typography variant="body1">
          Hộp thư cá nhân của Khách hàng, nơi nhận thông báo nổ đơn kèm Mã VietQR để thanh toán (Dev 1 phụ trách).
        </Typography>
        <Box sx={{ mt: 3, p: 2, bgcolor: '#f3e5f5', borderRadius: 1 }}>
          <Typography variant="body2" color="secondary">
            ⏳ Đang chờ code ở Phase 1...
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};
