import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

export const AdminDashboard: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" color="error" gutterBottom sx={{ fontWeight: 'bold' }}>
          👑 ADMIN DASHBOARD
        </Typography>
        <Typography variant="body1">
          Trang quản lý dành riêng cho ADMIN. Tại đây bạn sẽ Quản lý User (Dev 1 phụ trách).
        </Typography>
        <Box sx={{ mt: 3, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
          <Typography variant="body2" color="warning.main">
            ⏳ Đang chờ code ở Phase 1...
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};
