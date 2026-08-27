import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  CircularProgress, 
  Alert, 
  TablePagination,
  Chip,
  Avatar,
  Stack
} from '@mui/material';
import {
  AdminPanelSettingsOutlined,
  StorefrontOutlined,
  PersonOutlined,
  CalendarTodayOutlined,
  EmailOutlined
} from '@mui/icons-material';
import apiClient from '../../api/client';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/users?page=${page + 1}&limit=${rowsPerPage}`);
        setUsers(response.data.data);
        setTotalUsers(response.data.meta.total);
      } catch (err: any) {
        setError('Không thể lấy danh sách người dùng. ' + (err.response?.data?.message || ''));
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <AdminPanelSettingsOutlined fontSize="small" />;
      case 'SELLER': return <StorefrontOutlined fontSize="small" />;
      default: return <PersonOutlined fontSize="small" />;
    }
  };


  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f6f9fc', p: { xs: 2, md: 5 } }}>
      {/* Header Section */}
      <Box sx={{ mb: 5 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 800, 
            letterSpacing: '-1.5px',
            background: 'linear-gradient(90deg, #0a2540 0%, #635bff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}
        >
          Quản trị Hệ thống
        </Typography>
        <Typography variant="body1" sx={{ color: '#425466', fontWeight: 500, fontSize: '1.1rem' }}>
          Quản lý tài khoản và giám sát hoạt động nền tảng
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>{error}</Alert>}

      {/* Main Table Card */}
      <Paper 
        sx={{ 
          borderRadius: '12px', 
          boxShadow: '0 2px 5px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02)',
          overflow: 'hidden',
          bgcolor: '#ffffff',
          border: '1px solid #e3e8ee'
        }}
      >
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: '#ffffff' }}>
              <TableRow sx={{ borderBottom: '2px solid #e3e8ee' }}>
                <TableCell sx={{ color: '#0a2540', fontWeight: 700, py: 2.5, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Người dùng</TableCell>
                <TableCell sx={{ color: '#0a2540', fontWeight: 700, py: 2.5, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Liên hệ</TableCell>
                <TableCell sx={{ color: '#0a2540', fontWeight: 700, py: 2.5, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Vai trò</TableCell>
                <TableCell align="right" sx={{ color: '#0a2540', fontWeight: 700, py: 2.5, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Ngày tham gia</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={40} thickness={4} sx={{ color: '#635bff' }} />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 8, color: '#425466' }}>
                    Chưa có dữ liệu người dùng.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow 
                    key={user.id} 
                    hover
                    sx={{ 
                      transition: 'all 0.2s ease',
                      '&:hover': { 
                        bgcolor: '#f6f9fc', 
                      },
                      '& td': { borderBottom: '1px solid #e3e8ee' }
                    }}
                  >
                    {/* Cột 1: Avatar + Tên + ID */}
                    <TableCell sx={{ py: 2.5 }}>
                      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: user.role === 'ADMIN' ? '#fee2e2' : '#f3f4f6',
                            color: user.role === 'ADMIN' ? '#ef4444' : '#425466',
                            fontWeight: 600,
                            width: 40,
                            height: 40
                          }}
                        >
                          {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0a2540', fontSize: '0.95rem' }}>
                            {user.name || 'Người dùng ẩn danh'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#425466', fontFamily: 'monospace' }}>
                            #{user.id.substring(0, 8)}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    {/* Cột 2: Email */}
                    <TableCell sx={{ py: 2.5 }}>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        <EmailOutlined sx={{ fontSize: 18, color: '#425466' }} />
                        <Typography variant="body2" sx={{ color: '#425466', fontWeight: 500 }}>
                          {user.email}
                        </Typography>
                      </Stack>
                    </TableCell>

                    {/* Cột 3: Role (Badge) */}
                    <TableCell sx={{ py: 2.5 }}>
                      <Chip
                        icon={getRoleIcon(user.role)}
                        label={user.role}
                        size="small"
                        sx={{ 
                          fontWeight: 700, 
                          borderRadius: '6px',
                          px: 1,
                          bgcolor: user.role === 'ADMIN' ? '#fee2e2' : (user.role === 'SELLER' ? '#e0e7ff' : '#dcfce7'),
                          color: user.role === 'ADMIN' ? '#ef4444' : (user.role === 'SELLER' ? '#635bff' : '#10b981'),
                          '& .MuiChip-icon': { 
                            ml: 1, 
                            color: user.role === 'ADMIN' ? '#ef4444' : (user.role === 'SELLER' ? '#635bff' : '#10b981')
                          }
                        }}
                      />
                    </TableCell>

                    {/* Cột 4: Ngày tháng */}
                    <TableCell align="right" sx={{ py: 2.5 }}>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
                        <CalendarTodayOutlined sx={{ fontSize: 18, color: '#425466' }} />
                        <Typography variant="body2" sx={{ color: '#425466', fontWeight: 500 }}>
                          {new Date(user.createdAt).toLocaleDateString('vi-VN', {
                            day: '2-digit', month: '2-digit', year: 'numeric'
                          })}
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Phân trang */}
        <Box sx={{ borderTop: '1px solid #e3e8ee', bgcolor: '#ffffff' }}>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalUsers}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Dòng trên trang:"
            labelDisplayedRows={({ from, to, count }) => `${from} - ${to} trong tổng ${count}`}
            sx={{
              '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                color: '#425466',
                fontWeight: 600,
                mt: 1.5
              }
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};
