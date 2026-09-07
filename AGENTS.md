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

### 4.1. Phạm vi sở hữu code

- Chỉ chủ động tạo/sửa code thuộc phạm vi [BẠN]:
  - Backend: user, ai, direct-message.
  - Frontend: admin, viewer, inbox.
- Được phép đọc code [KỲ] để hiểu dependency, interface và data flow.
- Không được tự ý sửa code [KỲ]:
  - product
  - parser
  - order
  - livestream
  - seller/live-studio
- Với file [CHUNG] như auth, App.tsx, app.module.ts hoặc các file tích hợp:
  - Được phép đọc.
  - Nếu cần sửa phải nêu rõ lý do trong kế hoạch và chờ xác nhận.
- Nếu task của [BẠN] bắt buộc cần thay đổi code [KỲ], phải dừng lại,
  giải thích dependency và xin phép trước.

### 4.2. Bắt buộc lập kế hoạch trước khi sửa/thêm code

Với mọi task có sửa hoặc tạo code, trước tiên phải trình bày:

1. Mục tiêu.
2. File dự kiến tác động:
   - [CREATE] file tạo mới.
   - [MODIFY] file chỉnh sửa.
3. Luồng dữ liệu cụ thể của chức năng.
4. Dependency với module khác.
5. Rủi ro với cấu trúc hiện tại.
6. Có ảnh hưởng tới [KỲ] hoặc [CHUNG] hay không.

Trong bước này KHÔNG được sửa file.

Sau kế hoạch phải dừng lại và hỏi đúng:

> “Kế hoạch trên đã chuẩn xác chưa? Bạn có đồng ý để tôi tiến hành viết code không?”

Chỉ được sửa/tạo file sau khi người dùng trả lời:
- “Đồng ý”
- “OK”
- “Proceed”

### 4.3. Thực hiện code

Sau khi được xác nhận:

- Làm theo từng bước nhỏ.
- Không tự mở rộng scope.
- Không refactor phần không liên quan.
- Không tạo test/config/file không cần thiết.
- Không cài dependency mới nếu chưa được yêu cầu hoặc chưa giải thích lý do.
- Không tự thay đổi API contract, database schema hoặc kiến trúc chính.

Nếu trong lúc code phát hiện cần thay đổi ngoài kế hoạch đã duyệt:
- Dừng lại.
- Giải thích lý do.
- Xin xác nhận trước khi tiếp tục.

### 4.4. Giải thích sau mỗi bước có ý nghĩa

Sau mỗi bước thay đổi có ý nghĩa, trình bày:

#### [SƠ ĐỒ LUỒNG DỮ LIỆU - DATA FLOW]

Dùng chuỗi mũi tên, ví dụ:

Client
→ Controller
→ Service
→ Prisma
→ PostgreSQL
→ Response

#### [NGHIỆP VỤ BẰNG LỜI BÌNH DÂN]

Giải thích đúng 2–3 câu:
- Chức năng thực tế làm gì.
- Dữ liệu đi đâu.
- Người dùng cuối nhận được kết quả gì.

Không mổ xẻ cú pháp trừ khi được yêu cầu.

### 4.5. Review thay đổi

- Với thay đổi lớn hoặc rủi ro, trình bày diff dự kiến trước khi áp dụng khi có thể.
- Nếu thay đổi vẫn nằm hoàn toàn trong kế hoạch đã được duyệt, không cần xin phép lại cho từng dòng code.
- Nếu vượt khỏi kế hoạch, phải xin xác nhận lại.

Sau khi hoàn thành:
- Liệt kê file đã [CREATE]/[MODIFY].
- Tóm tắt thay đổi.
- Báo kết quả build/test/check đã thực hiện.

### 4.6. Build

Trước khi kết luận task hoàn thành:

- Chạy build phù hợp với workspace bị tác động.
- Không tự sửa lỗi ở module ngoài phạm vi chỉ để làm build xanh.
- Nếu build fail do code [KỲ] hoặc [CHUNG], báo rõ lỗi và dừng thay vì tự sửa.

Mục tiêu cuối cùng là đảm bảo thay đổi của [BẠN] không tạo thêm lỗi TypeScript/build.