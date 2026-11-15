import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Alert, Chip, Stack } from '@mui/material';
import { AdminPanelSettingsOutlined, GroupOutlined } from '@mui/icons-material';
import apiClient from '../../api/client';
import { surfaceTokens } from '../../theme';
import { AdminUserList, type AdminUser } from '../../components/admin/AdminUserList';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
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
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '';
        setError('Không thể lấy danh sách người dùng. ' + message);
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

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100dvh - 56px)', md: 'calc(100dvh - 64px)' },
        bgcolor: 'background.default',
        py: { xs: 2.5, md: 4 },
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
        {/* Header Section */}
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 3,
            borderRadius: 3,
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                bgcolor: surfaceTokens.primarySoft,
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AdminPanelSettingsOutlined />
            </Box>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: 'text.primary',
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  mb: 0.5,
                }}
              >
                Quản trị Hệ thống
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Quản lý danh sách tài khoản và phân quyền trên nền tảng LiveOrder
              </Typography>
            </Box>
          </Stack>

          <Chip
            icon={<GroupOutlined fontSize="small" />}
            label={`${totalUsers.toLocaleString('vi-VN')} tài khoản`}
            variant="outlined"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              bgcolor: surfaceTokens.primarySoft,
              borderColor: surfaceTokens.primaryBorder,
            }}
          />
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <AdminUserList
          users={users}
          loading={loading}
          page={page}
          rowsPerPage={rowsPerPage}
          totalUsers={totalUsers}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Container>
    </Box>
  );
};
