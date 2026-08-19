import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert } from '@mui/material';
import apiClient from '../../api/client';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tự động chạy khi mở trang để lấy danh sách User
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiClient.get('/users');
        setUsers(response.data);
      } catch (err: any) {
        setError('Không thể lấy danh sách người dùng. ' + (err.response?.data?.message || ''));
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" color="error" gutterBottom sx={{ fontWeight: 'bold' }}>
        👑 QUẢN LÝ TÀI KHOẢN (ADMIN)
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
        {loading ? (
          <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />
        ) : (
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Tên hiển thị</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Vai trò (Role)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ngày đăng ký</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Typography
                      variant="caption"
                      sx={{
                        px: 1, py: 0.5, borderRadius: 1, fontWeight: 'bold',
                        bgcolor: user.role === 'ADMIN' ? 'error.light' : (user.role === 'SELLER' ? 'primary.light' : 'success.light'),
                        color: 'white'
                      }}
                    >
                      {user.role}
                    </Typography>
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">Chưa có người dùng nào.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Container>
  );
};
