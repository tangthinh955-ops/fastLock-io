import React from 'react';
import { Box, CircularProgress, CssBaseline, ThemeProvider } from '@mui/material';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Navbar } from './components/common/Navbar';
import { appTheme } from './theme';
import { ROLE_HOME } from './utils/roleConfig';

const LoginPage = React.lazy(() =>
  import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = React.lazy(() =>
  import('./pages/auth/RegisterPage').then((m) => ({
    default: m.RegisterPage,
  })),
);
const AdminDashboard = React.lazy(() =>
  import('./pages/admin/AdminDashboard').then((m) => ({
    default: m.AdminDashboard,
  })),
);
const SellerDashboard = React.lazy(() =>
  import('./pages/seller/SellerDashboard').then((m) => ({
    default: m.SellerDashboard,
  })),
);
const LiveStudio = React.lazy(() =>
  import('./pages/seller/LiveStudio').then((m) => ({ default: m.LiveStudio })),
);
const AiSettingsPage = React.lazy(() =>
  import('./pages/seller/AiSettingsPage').then((m) => ({
    default: m.AiSettingsPage,
  })),
);
const ViewerPage = React.lazy(() =>
  import('./pages/viewer/ViewerPage').then((m) => ({ default: m.ViewerPage })),
);
const InboxPage = React.lazy(() =>
  import('./pages/inbox/InboxPage').then((m) => ({ default: m.InboxPage })),
);
const SellerInboxPage = React.lazy(() =>
  import('./pages/inbox/SellerInboxPage').then((m) => ({
    default: m.SellerInboxPage,
  })),
);

const HomeRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated && user) {
    return <Navigate to={ROLE_HOME[user.role] ?? ROLE_HOME.BUYER} replace />;
  }
  return <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Box
            sx={{
              minHeight: '100dvh',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.default',
              overflowX: 'clip',
            }}
          >
            <Navbar />
            <Box
              component="main"
              sx={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <React.Suspense
                fallback={
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      py: 8,
                    }}
                  >
                    <CircularProgress size={36} />
                  </Box>
                }
              >
                <Routes>
                  {/* Trang Đăng nhập & Đăng ký công khai */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  {/* Route dành riêng cho ADMIN */}
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Route dành riêng cho SELLER */}
                  <Route
                    path="/seller/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['SELLER']}>
                        <SellerDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/seller/live-studio"
                    element={
                      <ProtectedRoute allowedRoles={['SELLER']}>
                        <LiveStudio />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/seller/ai-settings"
                    element={
                      <ProtectedRoute allowedRoles={['SELLER']}>
                        <AiSettingsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/seller/inbox"
                    element={
                      <ProtectedRoute allowedRoles={['SELLER']}>
                        <SellerInboxPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Route dành riêng cho BUYER */}
                  <Route
                    path="/viewer"
                    element={
                      <ProtectedRoute allowedRoles={['BUYER']}>
                        <ViewerPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/inbox"
                    element={
                      <ProtectedRoute allowedRoles={['BUYER']}>
                        <InboxPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Điều hướng trang chủ & fallback theo trạng thái đăng nhập */}
                  <Route path="/" element={<HomeRedirect />} />
                  <Route path="*" element={<HomeRedirect />} />
                </Routes>
              </React.Suspense>
            </Box>
          </Box>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
