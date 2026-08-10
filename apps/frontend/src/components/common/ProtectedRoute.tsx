import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, type Role } from '../../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
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
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'SELLER') return <Navigate to="/seller/dashboard" replace />;
    return <Navigate to="/viewer" replace />;
  }

  return <>{children}</>;
};
