# QUY TẮC DỰ ÁN LIVEORDER (AGENTS.MD)

## 1. TÓM TẮT DỰ ÁN & LUỒNG NGHIỆP VỤ (CORE PIPELINE)
- **Mục tiêu:** Hệ thống Chốt đơn tự động & Tư vấn khách hàng qua Livestream bằng AI dành cho Đồ án.
- **Môi trường Live:** Mô phỏng bằng WebCam HTML5 + Socket.io Chat real-time.
- **Luồng xử lý Comment (Kép):**
  1. **Chốt đơn (Nhanh):** Comment chứa SKU (VD: "SP01 0912345678") -> Thuật toán Aho-Corasick bóc SKU (<1ms) -> Trừ kho Postgres (Atomic: `stock >= qty`) -> Bắn Socket nổ đơn lên màn hình Streamer -> Gọi Groq SDK gửi tin nhắn Inbox kèm link VietQR.
  2. **Tư vấn (AI):** Comment KHÔNG chứa SKU nhưng chứa CÂU HỎI (VD: "Cao 1m60 mặc size gì?") -> Gọi Groq SDK (Llama 3) đọc Teencode & Knowledge Base (từ DB) -> Trả lời tư vấn ngay trên Khung Chat.

## 2. CÔNG NGHỆ CHÍNH (TECH STACK)
- **Backend:** NestJS, PostgreSQL, Prisma ORM, Socket.io, Groq SDK (`groq-sdk`), Redis (Cache tuỳ chọn).
- **Frontend:** React 19, Vite, Material UI (MUI), React Router v6.

## 3. CẤU TRÚC DỰ ÁN & PHÂN CHIA QUYỀN SỞ HỮU (CHỐNG GIT CONFLICT)

```text
live-order-app/
├── AGENTS.md                       # File quy tắc AI
├── plan.md                         # File bảng tiến độ Checklist
├── progress.md
├── package.json                    # Monorepo setup (npm workspaces)
├── docker-compose.yml              # Container Postgres (5432) & Redis (6379)
│
├── apps/
│   ├── backend/                    # NestJS API & WebSocket Server
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Database Models
│   │   │   └── seed.ts             # 3 tài khoản mẫu: ADMIN, SELLER, BUYER
│   │   ├── src/
│   │   │   ├── app.module.ts
│   │   │   ├── main.ts
│   │   │   ├── core/
│   │   │   │   ├── aho-corasick/
│   │   │   │   └── redis/
│   │   │   ├── modules/
│   │   │   │   ├── auth/                        # [CHUNG] Đăng ký, Đăng nhập JWT, Guard
│   │   │   │   ├── user/                        # [BẠN] Quản lý User (ADMIN role)
│   │   │   │   ├── product/                     # [KỲ] CRUD Sản phẩm, SKU, Tồn kho
│   │   │   │   ├── parser/                      # [KỲ] Gọi Aho-Corasick & Regex
│   │   │   │   ├── order/                       # [KỲ] Tạo đơn hàng & Trừ kho Postgres
│   │   │   │   ├── livestream/                  # [KỲ] Socket.io Gateway kết nối Chat Live
│   │   │   │   ├── ai/                          # [BẠN] Groq SDK, System Prompt, KbEntry
│   │   │   │   └── direct-message/              # [BẠN] API Nhắn Inbox & Mã VietQR
│   │   └── package.json
│   │
│   └── frontend/                   # React 19 + Vite Web Application
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx             # [CHUNG] Router chính (Auth Guard)
│       │   ├── api/
│       │   ├── hooks/
│       │   ├── pages/
│       │   │   ├── admin/          # [BẠN] Dashboard ADMIN quản lý User
│       │   │   ├── auth/           # [CHUNG] Đăng nhập / Đăng ký
│       │   │   ├── seller/         # [KỲ] Dashboard (Products) & live-studio (WebCam)
│       │   │   ├── viewer/         # [BẠN] BUYER xem Live + Khung Chat AI
│       │   │   └── inbox/          # [BẠN] BUYER xem Inbox nhận VietQR
│       │   ├── components/
│       │   │   ├── common/         # Layout Navbar, Sidebar
│       │   │   ├── product/        
│       │   │   ├── stream/         
│       │   │   └── chat/           
│       └── package.json
```

## 4. QUY TẮC CHO AI AGENT
1. **Không tự ý sửa file của người kia:** Chỉ viết/sửa code thuộc phạm vi phân công của từng người.
2. **Code tối giản:** Không sinh ra các file test rác hay file config không cần thiết.
3. **Build sạch trước khi Push:** Bắt buộc đảm bảo `npm run build` thành công không có lỗi TypeScript.