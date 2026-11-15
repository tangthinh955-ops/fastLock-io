import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, type Role } from '../../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';
import { ROLE_HOME } from '../../utils/roleConfig';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100dvh',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // 1. Nếu chưa đăng nhập -> Chuyển về trang /login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Nếu đăng nhập rồi nhưng sai Quyền (Role) -> Điều hướng về trang thích hợp với Role của họ
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] ?? ROLE_HOME.BUYER} replace />;
  }

  return <>{children}</>;
};
