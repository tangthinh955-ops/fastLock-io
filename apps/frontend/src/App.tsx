import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Navbar } from './components/common/Navbar';

import { LoginPage } from './pages/auth/LoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { SellerDashboard } from './pages/seller/SellerDashboard';
import { ViewerPage } from './pages/viewer/ViewerPage';
import { InboxPage } from './pages/inbox/InboxPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Trang Đăng nhập công khai */}
          <Route path="/login" element={<LoginPage />} />

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

          {/* Mặc định chuyển về /login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
