# MASTER PLAN: REAL-TIME LIVE-COMMERCE CHỐT ĐƠN ENGINE & DISTRIBUTED INVENTORY LOCKS
---

> **HƯỚNG DẪN DÀNH CHO AGENT:** Đây là tài liệu hướng dẫn toàn diện để đồng hành cùng 2 lập trình viên (Thành viên A và Thành viên B) xây dựng lại hệ thống từ đầu bằng phương pháp **Phân chia tính năng dọc (Vertical Feature Split)**. Hãy sử dụng tài liệu này làm kim chỉ nam để hướng dẫn họ thực hiện từng nhiệm vụ nhỏ, kiểm thử liên tục và tránh tối đa việc xung đột mã nguồn.

---

## 🛠️ CẤU TRÚC DỰ ÁN & CÔNG NGHỆ (MONOREPO)
Dự án được tổ chức dưới dạng **Monorepo** sử dụng `npm workspaces`:
*   Thư mục gốc: `live-commerce-engine/`
*   Backend: `apps/backend/` (NestJS + Prisma ORM + TypeScript)
*   Frontend: `apps/frontend/` (React + Vite + Material UI + TypeScript)
*   Cơ sở dữ liệu & Bộ đệm: PostgreSQL + Redis (Chạy qua Docker Compose)

---

## 🏗️ BƯỚC 1: KHỞI TẠO HẠ TẦNG VÀ KHUNG GIAO DIỆN CHUNG (Cả 2 cùng làm)

Để bắt đầu mà không cản trở nhau, cả hai cần thiết lập một **"Khung xương" (App Shell)** chứa cấu trúc thư mục và hệ thống chuyển trang (Tabs/Routing). Sau đó, mỗi người sẽ chỉ làm việc trong các file/trang của riêng mình.

### 1. Khởi tạo dự án Monorepo:
Tạo cấu trúc thư mục gốc:
```text
live-commerce-engine/
├── package.json (cấu hình npm workspaces)
├── docker-compose.yml
├── apps/
│   ├── backend/ (NestJS)
│   └── frontend/ (React + Vite)
```

### 2. Thiết lập Khung giao diện (App Shell) tại `apps/frontend/src/App.tsx`:
Xây dựng một hệ thống Tabs hoặc Navigation Sidebar cơ bản. Chia ứng dụng thành các Tab độc lập:
*   `Tab 0: Tổng quan (Dashboard)` -> **Bạn A phụ trách**
*   `Tab 1: Quản lý Sản phẩm & Kho` -> **Bạn A phụ trách**
*   `Tab 2: Phòng Chốt Đơn Real-time` -> **Bạn B phụ trách**
*   `Tab 3: Quản lý Livestream` -> **Bạn B phụ trách**
*   `Tab 4: Lịch sử Đơn hàng` -> **Bạn A phụ trách**

```tsx
// Cấu trúc mẫu chia tab trong React để code không đụng nhau:
import React, { useState } from 'react';
import Tab0Dashboard from './components/Tab0Dashboard';
import Tab1Products from './components/Tab1Products';
import Tab2LiveMonitor from './components/Tab2LiveMonitor';
import Tab3Livestream from './components/Tab3Livestream';
import Tab4Orders from './components/Tab4Orders';

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  return (
    <div>
      {/* Sidebar/Navigation chuyển đổi activeTab */}
      {activeTab === 0 && <Tab0Dashboard />}
      {activeTab === 1 && <Tab1Products />}
      {activeTab === 2 && <Tab2LiveMonitor />}
      {activeTab === 3 && <Tab3Livestream />}
      {activeTab === 4 && <Tab4Orders />}
    </div>
  );
}
```
*Bạn A và Bạn B sẽ tạo các file component tương ứng trong thư mục `src/components/` và chỉ chỉnh sửa trong file component của mình.*

---

## 📅 LỘ TRÌNH PHÁT TRIỂN & HƯỚNG DẪN KIỂM THỬ TỪNG BƯỚC

### 📌 TUẦN 1: HỆ THỐNG XÁC THỰC vs QUẢN LÝ PHÒNG LIVESTREAM

#### 👤 THÀNH VIÊN A: Làm tính năng Xác thực & Phân quyền (Auth)
*   **Mục tiêu:** Đăng ký, đăng nhập tài khoản quản trị (JWT).
*   **Những file cần làm:**
    *   Backend: `apps/backend/src/modules/auth/*`
    *   Frontend: `apps/frontend/src/components/LoginForm.tsx` (Hoặc tích hợp thẳng vào App.tsx khi `!token`).
*   **Kiến thức cần hiểu:** JWT hoạt động thế nào, lưu accessToken vào LocalStorage và đính kèm vào Axios Header ra sao.
*   **Cách kiểm thử ngay (Instant Test):** 
    *   Backend: Dùng Swagger (`http://localhost:3001/docs`) thực hiện POST `/auth/login` bằng tài khoản mẫu xem có trả về chuỗi Token hay không.
    *   Frontend: Nhập tài khoản đúng, nhấn login. Nếu token được lưu vào LocalStorage và UI chuyển sang giao diện Dashboard thành công là đạt.

#### 👤 THÀNH VIÊN B: Làm tính năng Thiết lập Phòng Livestream
*   **Mục tiêu:** Tạo một phiên livestream và liên kết các sản phẩm muốn bán.
*   **Những file cần làm:**
    *   Backend: `apps/backend/src/modules/livestream/*` (API `POST /livestreams`)
    *   Frontend: `apps/frontend/src/components/Tab3Livestream.tsx`
*   **Kiến thức cần hiểu:** Cách lưu quan hệ 1-nhiều (1 Livestream chứa nhiều Sản phẩm được ghim bán) trong database PostgreSQL qua Prisma.
*   **Cách kiểm thử ngay (Instant Test):**
    *   Mở trang "Quản lý Livestream", chọn 3 sản phẩm ghim bán, nhập tên tài khoản TikTok Live -> Bấm Tạo.
    *   Kiểm tra database hoặc gọi API `GET /livestreams`, nếu xuất hiện bản ghi phòng live kèm danh sách sản phẩm liên kết -> Đạt.

---

### 📌 TUẦN 2: QUẢN LÝ SẢN PHẨM/KHO vs THUẬT TOÁN ĐỐI SÁNH SKU & TIKTOK LIVE CONNECTOR

#### 👤 THÀNH VIÊN A: Làm tính năng Quản lý Sản phẩm & Tồn kho
*   **Mục tiêu:** Thêm/sửa/xóa sản phẩm và cập nhật nhanh tồn kho vật lý.
*   **Những file cần làm:**
    *   Backend: `apps/backend/src/modules/product/*`
    *   Frontend: `apps/frontend/src/components/Tab1Products.tsx`
*   **Kiến thức cần hiểu:** Quản lý CSDL CRUD cơ bản với Prisma ORM.
*   **Cách kiểm thử ngay (Instant Test):**
    *   Bấm nút "Thêm sản phẩm", nhập SKU: `SP99`, Tồn kho: `50` -> Bấm Lưu.
    *   Nếu bảng sản phẩm hiện dòng mới và cơ sở dữ liệu lưu trữ thành công -> Đạt.

#### 👤 THÀNH VIÊN B: Lập trình thuật toán Aho-Corasick & Kết nối TikTok Live
*   **Mục tiêu:** Nhận comment trực tiếp từ TikTok và trích xuất đúng mã SKU + SĐT.
*   **Những file cần làm:**
    *   Backend: `apps/backend/src/modules/livestream/aho-corasick.ts` và `apps/backend/src/modules/livestream/livestream.service.ts` (phần tích hợp `tiktok-live-connector`).
*   **Kiến thức cần hiểu:** Thuật toán Aho-Corasick (xây dựng cây Trie, Failure Link), cơ chế hoạt động của Webcast API từ TikTok.
*   **Cách kiểm thử ngay (Instant Test):**
    *   Viết một Unit Test bằng Jest. Truyền vào hàm chuỗi comment: *"Mình mua SP99 sđt 0988123456 nhé"*.
    *   Nếu hàm phân tích và trả về chính xác đối tượng: `{ sku: "SP99", phone: "0988123456" }` -> Đạt.

---

### 📌 TUẦN 3: DASHBOARD THỐNG KÊ BIỂU ĐỒ vs PHÒNG CHỐT ĐƠN REAL-TIME (SOCKET)

#### 👤 THÀNH VIÊN A: Làm trang Dashboard & Biểu đồ doanh thu
*   **Mục tiêu:** Hiển thị tổng quan báo cáo kinh doanh cho chủ shop.
*   **Những file cần làm:**
    *   Backend: `apps/backend/src/modules/analytics/*` (Tính toán tổng doanh thu, biểu đồ doanh thu theo ngày).
    *   Frontend: `apps/frontend/src/components/Tab0Dashboard.tsx`
*   **Kiến thức cần hiểu:** Cách sử dụng thư viện Recharts để vẽ biểu đồ Line/Bar chart từ dữ liệu API.
*   **Cách kiểm thử ngay (Instant Test):**
    *   Truy cập Dashboard, nếu biểu đồ hiển thị đúng đường đi của doanh thu và các thẻ số lượng đơn hàng khớp với database -> Đạt.

#### 👤 THÀNH VIÊN B: Phát triển Phòng Chốt Đơn & WebSocket
*   **Mục tiêu:** Luồng dữ liệu (bình luận, đơn hàng) cập nhật tức thì trên màn hình không cần tải lại trang.
*   **Những file cần làm:**
    *   Backend: `apps/backend/src/gateways/notification.gateway.ts` (Socket.IO Gateway)
    *   Frontend: `apps/frontend/src/components/Tab2LiveMonitor.tsx`
*   **Kiến thức cần hiểu:** Cơ chế kết nối 2 chiều của WebSocket và cách cập nhật React State không gây chậm (lag) màn hình khi tải cao.
*   **Cách kiểm thử ngay (Instant Test):**
    *   Mở trang "Phòng Chốt Đơn". Chạy một script nhỏ ở Backend gửi event socket `comment-received`.
    *   Nếu thấy tin nhắn hiển thị ngay trên màn hình phòng chốt đơn mà không cần F5 -> Đạt.

---

### 📌 TUẦN 4: LỊCH SỬ ĐƠN HÀNG vs HÀNG ĐỢI BULLMQ & KHÓA KHO PHÂN TÁN (REDIS)

#### 👤 THÀNH VIÊN A: Quản lý Lịch sử Đơn hàng
*   **Mục tiêu:** Hiển thị toàn bộ đơn hàng chốt thành công/thất bại để admin đóng gói.
*   **Những file cần làm:**
    *   Backend: `apps/backend/src/modules/order/*`
    *   Frontend: `apps/frontend/src/components/Tab4Orders.tsx`
*   **Cách kiểm thử ngay (Instant Test):**
    *   Tạo thử một đơn hàng trong database. Trang "Quản lý Đơn hàng" phải tải ra được dòng đơn hàng đó cùng bộ lọc trạng thái.

#### 👤 THÀNH VIÊN B: Hàng đợi BullMQ & Khóa kho nguyên tử Redis Redlock
*   **Mục tiêu:** Xử lý chốt đơn an toàn khi hàng nghìn người cùng comment tranh chấp sản phẩm cuối cùng.
*   **Những file cần làm:**
    *   Backend: `apps/backend/src/modules/comment/comment.processor.ts` (BullMQ Consumer) và bộ khóa kho dùng Lua Script kết nối Redis.
*   **Kiến thức cần hiểu:**
    *   Hàng đợi **BullMQ (Redis)** hoạt động theo cơ chế FIFO (First In, First Out).
    *   **Distributed Lock (Redis Redlock):** Khóa tạm thời mã sản phẩm ở mức mili-giây để ngăn chặn lỗi bán vượt (Overselling/Race Condition).
*   **Cách kiểm thử ngay (Instant Test - *Cực kỳ quan trọng*):**
    *   Cài đặt tồn kho sản phẩm `SP99` là **3**.
    *   Chạy script giả lập bắn 50 comment chốt sản phẩm `SP99` cùng một lúc.
    *   If hệ thống tạo ra **chính xác 3 đơn hàng**, tồn kho giảm về **0** và không có bất kỳ sản phẩm nào bị bán lố (overselling) -> Đạt chứng nhận chất lượng hệ thống.

---

## 🤝 QUY TẮC CỘNG TÁC GIT ĐỂ TRÁNH XUNG ĐỘT (GIT PROTOCOL)

Để tuyệt đối không đè code lên nhau:
1. **Tuyệt đối không sửa chung một file cấu hình hệ thống** mà không báo trước (ví dụ: `docker-compose.yml`, `package.json`, `prisma/schema.prisma`). Nếu cần sửa, cả hai phải ngồi lại thống nhất và gộp nhánh ngay lập tức.
2. **Quy tắc đặt tên nhánh (Branching):**
    *   Thành viên A làm việc trên nhánh: `feature/auth-products-dashboard`
    *   Thành viên B làm việc trên nhánh: `feature/live-queue-locks`
3. **Quy trình kéo và đẩy code:**
    *   Trước khi code ngày mới: Chạy `git checkout main` -> `git pull` -> Chuyển về nhánh của mình -> `git merge main` để lấy những thay đổi mới nhất của bạn mình về máy.
    *   Khi hoàn thành 1 giai đoạn: Tạo Pull Request (PR) trên GitHub, người kia vào nhấn xác nhận (Review) rồi mới gộp vào nhánh `main`.
