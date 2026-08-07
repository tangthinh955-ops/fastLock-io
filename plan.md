# MASTER PLAN: REAL-TIME LIVE-COMMERCE CHỐT ĐƠN ENGINE

> **HƯỚNG DẪN DÀNH CHO AGENT:** Đây là tài liệu hướng dẫn toàn diện để đồng hành cùng 2 lập trình viên (Dev 1 - Bạn, Dev 2 - Kỳ) xây dựng hệ thống bằng phương pháp **Phân chia tính năng dọc (Vertical Feature Split)**. Tuân thủ tuyệt đối sự phân công trong `AGENTS.md` để tránh Git Conflict.

---

## 📅 LỘ TRÌNH PHÁT TRIỂN 4 GIAI ĐOẠN (TIMELINE: 10 TUẦN)

### 🔴 PHASE 0: FOUNDATION (Tuần 1 - Cả 2 cùng làm / Dev 1 lead)
- **Mục tiêu:** Thiết lập xong nền tảng, Prisma Schema, Auth và React Router.
- **Backend (Dev 1 tập trung):** 
  - Khởi tạo thư mục theo đúng cấu trúc `AGENTS.md`.
  - Định nghĩa `prisma/schema.prisma` và `seed.ts` (ADMIN, SELLER, BUYER).
  - Viết module `auth` và `user` (JWT Login/Register, Roles).
- **Frontend (Dev 1 tập trung):** 
  - Tạo cấu trúc thư mục `pages/`, `components/`, `hooks/`.
  - Dựng App Router (`App.tsx`) với Auth Guard (`ProtectedRoute`). Phân quyền route ADMIN, SELLER, BUYER.

### 🟠 PHASE 1: CORE ENGINE (Tuần 2-4 - Làm song song)

**👤 Dev 2 (Kỳ) - Luồng Bán hàng & Livestream:**
- **Tuần 2:** Module `product` và UI `/seller/dashboard`. Xử lý trừ kho an toàn Postgres.
- **Tuần 3:** Thuật toán Aho-Corasick (`src/core/aho-corasick`), Regex SĐT (`modules/parser`) và `modules/order`.
- **Tuần 4:** Module `livestream` + Socket Gateway + UI `/seller/live-studio` (WebCam + Nổ đơn).

**👤 Dev 1 (Bạn) - Luồng AI, Admin & Hỗ trợ:**
- **Tuần 2:** Module `direct-message` (Tạo VietQR Link) + Lịch sử tin nhắn + UI `/admin` (Quản lý User).
- **Tuần 3:** Module `ai` (Groq SDK Llama 3, inject KbEntry & Teencode từ DB).
- **Tuần 4:** UI `/viewer` (Giao diện khách xem Live + Chat) + UI `/inbox` (Hộp thư nhận VietQR).

### 🟡 PHASE 2: INTEGRATION (Tuần 5-6 - Hợp nhất)
- Kết nối Socket Gateway (Kỳ) với Module AI (Bạn).
- Xử lý luồng: Nhận Comment -> Check SKU -> Nếu có: Nổ đơn + Inbox VietQR -> Nếu không: Trả lời AI trên Chat.

### 🟢 PHASE 3: POLISH & DEMO (Tuần 7-10)
- Xây dựng Dashboard thống kê (Tuỳ chọn).
- Hoàn thiện UI/UX và chuẩn bị kịch bản demo bảo vệ đồ án.

---

## 🤝 QUY TẮC CỘNG TÁC GIT ĐỂ TRÁNH XUNG ĐỘT
1. **Prisma Migrate:** Chỉ 1 người được chạy `npx prisma migrate dev`. Người còn lại kéo code về chỉ chạy `npx prisma generate`.
