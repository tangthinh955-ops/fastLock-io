import React from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  TablePagination,
  Chip,
  Avatar,
  Stack,
  Typography,
  Divider,
} from '@mui/material';
import {
  AdminPanelSettingsOutlined,
  StorefrontOutlined,
  PersonOutlined,
  CalendarTodayOutlined,
  EmailOutlined,
  GroupOutlined,
} from '@mui/icons-material';
import type { Role } from '../../context/AuthContext';
import { surfaceTokens } from '../../theme';
import { getRoleMeta } from '../../utils/roleConfig';

export interface AdminUser {
  id: string;
  name?: string;
  email: string;
  role: Role;
  createdAt: string;
}

interface AdminUserListProps {
  users: AdminUser[];
  loading: boolean;
  page: number;
  rowsPerPage: number;
  totalUsers: number;
  onPageChange: (_event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const formatJoinDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const renderRoleIcon = (role: Role) => {
  if (role === 'ADMIN') return <AdminPanelSettingsOutlined fontSize="small" />;
  if (role === 'SELLER') return <StorefrontOutlined fontSize="small" />;
  return <PersonOutlined fontSize="small" />;
};

const RoleChip: React.FC<{ role: Role }> = ({ role }) => {
  const meta = getRoleMeta(role);
  return (
    <Chip
      icon={renderRoleIcon(role)}
      label={meta.label}
      size="small"
      variant="outlined"
      sx={{
        fontWeight: 700,
        borderRadius: 1.5,
        px: 0.5,
        bgcolor: meta.bg,
        color: meta.color,
        borderColor: meta.borderColor,
        '& .MuiChip-icon': { color: meta.color },
      }}
    />
  );
};

const UserIdentity: React.FC<{ user: AdminUser }> = ({ user }) => {
  const isAdmin = user.role === 'ADMIN';
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
      <Avatar
        sx={{
          bgcolor: isAdmin ? surfaceTokens.liveRedSoft : surfaceTokens.mutedBg,
          color: isAdmin ? surfaceTokens.liveRedText : surfaceTokens.textPrimary,
          fontWeight: 700,
          width: 40,
          height: 40,
          flexShrink: 0,
        }}
      >
        {(user.name || user.email || 'U').charAt(0).toUpperCase()}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', overflowWrap: 'anywhere' }}>
          {user.name || 'Người dùng ẩn danh'}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          #{user.id.substring(0, 8)}
        </Typography>
      </Box>
    </Stack>
  );
};

export const AdminUserList: React.FC<AdminUserListProps> = ({
  users,
  loading,
  page,
  rowsPerPage,
  totalUsers,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const renderStateContent = () => {
    if (loading) {
      return (
        <Stack spacing={1.5} sx={{ py: 6, alignItems: 'center' }}>
          <CircularProgress size={36} />
          <Typography variant="body2" color="text.secondary">
            Đang tải danh sách tài khoản...
          </Typography>
        </Stack>
      );
    }

    return (
      <Stack spacing={1} sx={{ py: 6, px: 2, textAlign: 'center', alignItems: 'center' }}>
        <GroupOutlined sx={{ fontSize: 40, color: 'text.disabled' }} />
        <Typography variant="body1" color="text.secondary">
          Chưa có dữ liệu người dùng.
        </Typography>
      </Stack>
    );
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', bgcolor: 'background.paper' }}>
      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8125rem' }}>
                  NGƯỜI DÙNG
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8125rem' }}>
                  LIÊN HỆ
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8125rem' }}>
                  VAI TRÒ
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8125rem' }}>
                  NGÀY THAM GIA
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading || users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>{renderStateContent()}</TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <UserIdentity user={user} />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <EmailOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          {user.email}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <RoleChip role={user.role} />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
                        <CalendarTodayOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}
                        >
                          {formatJoinDate(user.createdAt)}
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Mobile User Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, p: 2 }}>
        {loading || users.length === 0 ? (
          renderStateContent()
        ) : (
          <Stack spacing={1.5}>
            {users.map((user) => (
              <Paper key={user.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: 'background.paper' }}>
                <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <UserIdentity user={user} />
                  <Box sx={{ flexShrink: 0 }}>
                    <RoleChip role={user.role} />
                  </Box>
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                <Stack spacing={0.75}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <EmailOutlined sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                      {user.email}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <CalendarTodayOutlined sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                    <Typography variant="body2" color="text.secondary">
                      Tham gia: {formatJoinDate(user.createdAt)}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      {/* Pagination */}
      <Box sx={{ borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalUsers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          labelRowsPerPage="Số dòng:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
          sx={{
            '& .MuiTablePagination-toolbar': {
              flexWrap: 'wrap',
              justifyContent: { xs: 'space-between', sm: 'flex-end' },
              gap: 1,
              px: { xs: 1.5, sm: 2 },
              py: 1,
            },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              color: 'text.secondary',
              fontWeight: 600,
              m: 0,
            },
            '& .MuiTablePagination-actions button': {
              minWidth: 44,
              minHeight: 44,
            },
          }}
        />
      </Box>
    </Paper>
  );
};

