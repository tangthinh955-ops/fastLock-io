import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<div>Trang Đăng nhập (TODO)</div>} />
        
        {/* BUYER / VIEWER ROUTES */}
        <Route path="/viewer" element={<div>Trang Khách Xem Live (TODO)</div>} />
        <Route path="/inbox" element={<div>Hộp thư VietQR (TODO)</div>} />

        {/* SELLER ROUTES */}
        <Route path="/seller/dashboard" element={<div>Dashboard Sản phẩm (TODO)</div>} />
        <Route path="/seller/live-studio" element={<div>Phòng Live Studio (TODO)</div>} />

        {/* ADMIN ROUTES */}
        <Route path="/admin" element={<div>Trang quản trị Admin (TODO)</div>} />
      </Routes>
    </BrowserRouter>
  );
}
