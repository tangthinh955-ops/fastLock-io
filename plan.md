# 📋 LIVEORDER — PRODUCTION READINESS MASTER PLAN (LỘ TRÌNH 5 ĐỢT SONG SONG)

> **Phiên bản:** v2.0 (Chuẩn hóa & Tinh gọn) — Ngày cập nhật: 05/10/2026  
> **Dev 1 (Thịnh):** AI, Inbox, Admin, Viewer, Lead Luồng Buyer & Tài liệu  
> **Dev 2 (Kỳ):** Product, Parser, Order, Livestream, Seller Studio, Lead Luồng Seller & DevOps/CI  
> **Nguyên tắc thực thi:** Làm việc song song theo 5 đợt; kiểm thử trên dữ liệu thật; số liệu đo đạc khách quan; cập nhật tiến độ chi tiết tại `progress.md`.

---

## 1. ĐÁNH GIÁ HIỆN TRẠNG & NGUYÊN TẮC CỐT LÕI

### 1.1. Hiện trạng hệ thống (~75% hoàn thiện)
* **Điểm mạnh cốt lõi:** Thuật toán Aho-Corasick bóc SKU siêu tốc, Trừ kho nguyên tử Postgres chống oversell (`stock >= qty`), WebCam LiveStudio HTML5, ViewerPage đã kết nối Socket.io, AI Groq Qwen tư vấn theo Knowledge Base và 10 tin lịch sử hội thoại.
* **Các điểm nghẽn kỹ thuật cần xử lý:**
  1. `ProductController`, `OrderController`, `LivestreamController` chưa có Auth Guard (cần gắn JWT & Role Guard).
  2. Sự kiện Socket `send_comment` cần trích danh tính trực tiếp từ JWT handshake (`client.data.user.userId`), không tin payload từ client.
  3. Che thông tin riêng tư (SĐT khách) phải xử lý tại **Server** trước khi broadcast ra phòng Live công khai.
  4. Seed data cần dùng UUID v4 chuẩn nhưng dạng **hằng số cố định (Deterministic)** để không làm gãy quan hệ dữ liệu cũ.
  5. **Nguyên tắc AI:** Tập trung 100% vào **Inbox riêng** với cơ chế **Seller tiếp quản (Human Takeover)**; không tự động gọi AI trên chat Live để bảo toàn quota và tránh lỗi Groq 429.
  6. **Đo đạc trung thực:** Benchmark Aho-Corasick và đo pipeline trên tập dữ liệu thật, ghi nhận số liệu khách quan, không gán ghép định kiến trước.
  7. **Rõ ràng vai trò Lead:** Các công việc tích hợp (Docker, CI/CD, Swagger, Security) đều có 1 người chịu trách nhiệm chính.

---

## 2. MA TRẬN 5 ĐỢT TRIỂN KHAI SONG SONG (5 PARALLEL WAVES)

| Đợt | Dev 1 — Thịnh (Lead Buyer & AI) | Dev 2 — Kỳ (Lead Seller & Engine) | Mục tiêu nghiệm thu đợt |
|:---:|:---|:---|:---|
| **ĐỢT 1<br/>Nền Tảng & Bảo Mật** | **Sửa nền tảng Inbox & Quyền AI/QR hiện có:**<br>• Phân loại nguồn tin (BUYER, SELLER, AI, SYSTEM, UNKNOWN).<br>• Phân trang tin cũ, kiểm tra logic đọc tin.<br>• Rà soát quyền tạo link VietQR và giới hạn token AI. | **Quyền API/Socket & Che dữ liệu riêng tư:**<br>• Auth/Role Guard cho Product, Order, Livestream.<br>• Server che SĐT (`0912***678`) trước khi broadcast Socket.<br>• Trích `buyerId` từ Socket JWT; cập nhật LiveStudio gửi token. | **Hệ thống an toàn:** Không còn endpoint hở; LiveStudio và Viewer kết nối có JWT; SĐT không bị lộ ở Network tab. |
| **ĐỢT 2<br/>Realtime & Vòng Đời Đơn** | **Inbox Realtime & Seller tiếp quản:**<br>• WebSocket Gateway cho Inbox (`new_message`).<br>• Xử lý Reconnect, chống lặp tin, trạng thái đã đọc.<br>• Cơ chế Seller tiếp quản (tắt AI khi Seller trực tiếp chat). | **Chống lặp đơn & Vòng đời đơn + Hoàn kho:**<br>• Chống tạo đơn trùng khi spam comment (`eventId` unique).<br>• Tách lỗi thông báo/QR khỏi commit đơn.<br>• Máy trạng thái `PENDING` → `PAID`/`CANCELLED`; hủy đơn hoàn kho an toàn. | **Luồng chốt mượt:** Chốt đơn không sợ trùng; Inbox chat nảy tức thì; Seller ngắt được AI; Hủy đơn kho tự cộng lại. |
| **ĐỢT 3<br/>Nghiệp Vụ Hai Đầu** | **Buyer Orders & Form người nhận & QR Shop:**<br>• Trang lịch sử mua hàng của Buyer (`/orders`).<br>• Form nhập địa chỉ, snapshot thông tin vào đơn.<br>• Động hóa VietQR theo STK Shop; chống gửi QR trùng. | **Seller Orders & Báo cáo thống kê:**<br>• Trang quản lý đơn của Seller (`/seller/orders`).<br>• Thao tác duyệt/hủy đơn; API snapshot người nhận.<br>• Báo cáo doanh thu thực thu (đơn PAID), Top SP. | **Nghiệp vụ khép kín:** Khách điền địa chỉ nhận hàng → Quét QR đúng STK Shop → Seller duyệt đơn và xem báo cáo doanh thu. |
| **ĐỢT 4<br/>Kiểm Thử & Đo Đạc** | **Đánh giá AI & Kiểm thử Inbox/Viewer:**<br>• Đánh giá AI theo bộ 20 tình huống thực tế (bảng size, đổi SP, vượt quota).<br>• Test phân quyền Frontend (ProtectedRoute, AuthContext).<br>• Unit test cho AiService và DirectMessageService. | **Đo đạc Parser & Test Concurrency kho:**<br>• Đo đạc thời gian bóc SKU của Aho-Corasick so với Regex (ghi nhận số liệu thật).<br>• Test trừ kho đồng thời (Concurrency/Race Condition).<br>• Unit test Order và Product Service. | **Bằng chứng thuyết phục:** Có số liệu benchmark đo đạc thật; test case pass sạch; chứng minh không âm kho khi nhiều người mua cùng lúc. |
| **ĐỢT 5<br/>Đóng Gói & Nghiệm Thu** | **Lead Tài liệu & Nghiệm thu luồng Buyer:**<br>• Cấu hình Swagger UI cho Auth, User, AI, DM.<br>• Viết README hoàn chỉnh luồng nghiệp vụ.<br>• Nghiệm thu E2E toàn bộ hành trình Buyer (Xem Live → Chốt đơn → Inbox tư vấn → Thanh toán). | **Lead Đóng gói/CI & Nghiệm thu luồng Seller:**<br>• Viết Dockerfile multi-stage (BE, FE, Nginx) + docker-compose.<br>• Thiết lập GitHub Actions CI (Lint, Test, Build).<br>• Hardening Helmet, CORS, Rate Limit Redis.<br>• Nghiệm thu E2E toàn bộ hành trình Seller (Live Studio → Quản lý đơn → Báo cáo). | **Sẵn sàng bảo vệ/triển khai:** Chạy hệ thống qua 1 lệnh Docker; CI xanh; Swagger đầy đủ; kịch bản demo trơn tru cả 2 đầu. |

---

## 3. BẢNG PHÂN BỔ 18 PHIÊN LÀM VIỆC CHI TIẾT

> **Ký hiệu:** 🟦 Thịnh (Dev 1 Lead) | 🟩 Kỳ (Dev 2 Lead)

| Phiên | Tên phiên làm việc | Lead | Nhánh Git | Nhiệm vụ kỹ thuật cốt lõi | Tiêu chuẩn hoàn thành (DoD) |
|:---:|:---|:---:|:---|:---|:---|
| **S01** | Vá Auth Guard Controller & Quyền tài nguyên | 🟩 | `fix/auth-guards-dev2` | Gắn `@UseGuards(JwtAuthGuard, RolesGuard)` cho Product, Order, Livestream; lấy `userId` từ token; kiểm tra quyền xem chi tiết live và đơn shop. | Không token → 401; Buyer tạo/sửa SP → 403; truy cập chéo shop bị chặn. |
| **S02** | Chuẩn hóa Seed UUID & Env & Fix lỗi | 🟨 | `fix/schema-seed-env` | Giữ nguyên cú pháp Prisma nếu chạy tốt; chuẩn hóa Seed sang UUID cố định; tạo 3 file `.env.example`; LiveStudio dùng `apiClient`. | Chạy lại seed không làm gãy quan hệ dữ liệu cũ; gọi API seed user không bị lỗi 400. |
| **S03** | Bảo mật danh tính Socket & Quyền sự kiện | 🟩 | `fix/socket-auth-identity` | Trong `LivestreamGateway`: Kiểm tra quyền ở từng sự kiện `join_room`, `send_comment`; bắt buộc gán `buyerId = client.data.user.userId`. | Client gửi ID giả mạo trong payload vẫn ghi nhận đúng user trong JWT. |
| **S04** | Hoàn thiện Nổ đơn E2E & Server Mask Phone | 🟩🟦 | `feat/viewer-order-streamline` | **Kỳ (Server):** Che SĐT thành `0912***678` trước khi broadcast.<br>**Thịnh (Client):** Bắt `new_order`, popup nổ đơn đúng cho Buyer sở hữu. | Comment trên Live che SĐT ngay từ Network tab; popup nổ đơn chuẩn cho cả 2 bên. |
| **S05** | Luồng Tư vấn AI Inbox & Seller tiếp quản | 🟦 | `feat/inbox-ai-consult-flow` | Nút "Tư vấn Shop" từ Viewer mở thẳng Inbox Seller; AI đọc KB tư vấn; không gọi AI trên Live; thêm cờ Human Takeover ngắt AI khi Seller chat. | Chat Live chỉ nổ đơn; Inbox tư vấn size chính xác theo KB; Seller chat thì AI im lặng. |
| **S06** | WebSocket Realtime Inbox & Deduplication | 🟦 | `feat/inbox-realtime-socket` | Tạo `DirectMessageGateway`; hỗ trợ Reconnect, chống nhận tin trùng qua messageId; đồng bộ trạng thái đọc; phân biệt 4 nguồn tin. | 2 bên chat thấy tin nảy tức thì; AI trả lời hiện bong bóng ngay; không nhân đôi tin khi lag. |
| **S07** | Động hóa VietQR theo Shop & Chống gửi trùng | 🟦 | `feat/dynamic-vietqr` | Cấu hình STK ngân hàng theo Seller; sinh VietQR chuẩn STK Shop; kiểm tra `orderId` chống gửi 2 tin QR cho cùng 1 đơn hàng khi retry. | Shop A ra QR Vietcombank, Shop B ra QR MBBank; retry thông báo không bị trùng QR. |
| **S08** | Vòng đời Đơn hàng & Hoàn kho an toàn | 🟩 | `feat/order-lifecycle` | Máy trạng thái `PENDING` → `PAID` / `CANCELLED`; hủy đơn hoàn kho trong Transaction DB; kiểm tra chống hủy/hoàn kho 2 lần khi bấm đúp. | Seller bấm "Đã nhận tiền" → PAID; bấm "Hủy" → kho hoàn lại; bấm 2 lần không hoàn đúp. |
| **S09** | Trang Đăng ký Tài khoản mới (Register Page) | 🟦 | `feat/register-page` | Tạo `RegisterPage.tsx` có validate form; nối API `POST /auth/register`; đăng ký xong tự động đăng nhập và chuyển hướng vào Viewer. | Người dùng mới tự tạo tài khoản thành công mà không cần seed hay tạo tay trong DB. |
| **S10** | Admin CRUD User & Khóa tài khoản tức thì | 🟦 | `feat/admin-user-management` | Thêm `isActive` vào User; `JwtStrategy` chặn user bị khóa; Admin UI có nút Đổi Role, Khóa/Mở khóa tài khoản có xác nhận. | Khóa user → user đó lập tức bị logout và chặn mọi request ngay lập tức. |
| **S11** | Dashboard Thống kê Doanh thu & Báo cáo Seller | 🟩 | `feat/seller-analytics` | API & UI thống kê: Doanh thu thực thu (chỉ tính đơn PAID), Số đơn theo trạng thái, Top 5 sản phẩm bán chạy nhất trong shop. | Số liệu báo cáo doanh thu và top bán chạy khớp 100% với dữ liệu database. |
| **S12** | Upload Ảnh Thật & Phân trang Server-side | 🟩 | `feat/product-image-upload` | Multer upload file ảnh lên server; phục vụ file tĩnh; phân trang API `GET /products` (10 SP/trang) kèm tìm kiếm SKU/tên. | Seller tải ảnh từ máy tính hiển thị chuẩn trên Dashboard và màn hình xem Live. |
| **S13** | Swagger API Documentation chuẩn OpenAPI | 🟦 | `feat/swagger-docs` | Thịnh lead setup Swagger UI tại `/api/docs`; cả 2 dev gắn decorator `@ApiTags`, `@ApiOperation`, `@ApiProperty` cho module của mình. | Truy cập web test API trực quan, đầy đủ tài liệu phục vụ hội đồng chấm đồ án. |
| **S14** | Unit Test Core & Benchmark Aho-Corasick | 🟩 | `test/core-unit-tests` | Test Aho-Corasick, Parser, Atomic Stock; viết script đo thời gian bóc SKU thực tế so với Regex trên tập 100–1.000 SKU để lấy số liệu vào slide. | Chạy `npm run test` pass 100%; có số liệu thực nghiệm trung thực đưa vào báo cáo. |
| **S15** | Unit Test AI, DirectMessage & Frontend Tests | 🟦 | `test/ai-dm-frontend` | Test AiService (mock Groq, test 20 KB), test DirectMessage, test Auth Guard Frontend (ProtectedRoute, AuthContext session). | Test AI kiểm soát tốt token; test Guard chặn đúng role; không có lỗi tiềm ẩn. |
| **S16** | Dockerfile Multi-stage & Compose Production | 🟩 | `devops/docker-production` | Kỳ lead viết Dockerfile tối ưu cho Backend & Frontend (Nginx proxy); cập nhật `docker-compose.yml` gồm Postgres, Redis, Backend, Frontend. | Chạy `docker compose up --build` khởi động toàn bộ hệ thống mượt mà trên máy mới. |
| **S17** | GitHub Actions CI Pipeline tự động hóa | 🟩 | `devops/github-actions-ci` | Kỳ lead tạo workflow GitHub Actions: Tự động chạy Lint check → Type check (`tsc --noEmit`) → Chạy Test → Chạy Build khi có PR vào `main`. | PR tự động kiểm tra, báo tích xanh mới cho merge, loại bỏ hoàn toàn lỗi gãy build. |
| **S18** | Security Hardening & Hoàn thiện README Demo | 🟦 | `chore/security-readme-final` | Thịnh lead audit bảo mật: Bật Helmet, chặn CORS mở, áp Rate Limit Redis, xóa `killPort()`, viết tài liệu `README.md` và kịch bản demo. | `npm audit` sạch lỗ hổng; README có sơ đồ kiến trúc hoàn chỉnh và kịch bản demo mượt. |

---

## 4. CHECKLIST SCHEMA & CƠ CHẾ DỮ LIỆU ĐÃ THỐNG NHẤT

> [!IMPORTANT]
> Toàn bộ các thay đổi dưới đây đã được rà soát và bắt buộc phải thống nhất trước khi chạy migration:

### 4.1. Bảng Hội thoại & Cơ chế Seller tiếp quản (Phục vụ S05, S06)
```prisma
enum ChatMode {
  AI
  HUMAN
}

model Conversation {
  id        String   @id @default(uuid())
  buyerId   String
  sellerId  String
  mode      ChatMode @default(AI)
  version   Int      @default(1)
  updatedAt DateTime @updatedAt

  @@unique([buyerId, sellerId])
}
```

### 4.2. Bổ sung nguồn tin nhắn & Tham chiếu đơn hàng (Phục vụ S06, S07)
```prisma
enum MessageSource {
  BUYER
  SELLER
  AI
  SYSTEM
  UNKNOWN // Giữ nguyên vẹn tính trung thực cho dữ liệu lịch sử cũ
}

// Bổ sung vào model DirectMessage:
// - source         MessageSource @default(UNKNOWN)
// - conversationId String?
// - orderId        String?       // Gắn với Order, chống gửi trùng link VietQR
```

### 4.3. Bổ sung chống lặp, Audit Trail & Snapshot đơn hàng (Phục vụ S04, S07, S08, S11)
```prisma
// Bổ sung vào model Order:
// - eventId            String?   @unique // Chống nổ đơn trùng khi retry comment
// - notificationStatus String    @default("PENDING") // SENT, FAILED (thử lại gửi QR mà không tạo lại đơn)
// - receiverName       String?   // Snapshot người nhận
// - receiverPhone      String?   // Snapshot SĐT nhận
// - receiverAddress    String?   // Snapshot địa chỉ giao hàng
// - paidAt             DateTime? // Thời điểm Seller xác nhận tiền
// - confirmedById      String?   // User ID của người xác nhận thanh toán
```

### 4.4. Bổ sung tài khoản ngân hàng & Trạng thái User (Phục vụ S07, S10)
```prisma
// Bổ sung vào model User:
// - bankCode    String? // Mã ngân hàng (VD: ICB, VCB, MB) phục vụ VietQR động
// - bankAccount String? // Số tài khoản ngân hàng của Seller
// - isActive    Boolean @default(true) // Hỗ trợ Admin khóa/mở khóa tài khoản
```

---

## 5. QUY TRÌNH PHỐI HỢP GIT ĐỂ TRÁNH XUNG ĐỘT

1. **Khởi động phiên làm việc:**
   * `git status` kiểm tra thay đổi dở dang.
   * `git checkout main && git pull origin main`.
   * `npm install && cd apps/backend && npx prisma generate`.
   * Tạo nhánh tính năng riêng theo đúng bảng phân bổ: `git checkout -b <nhanh-git>`.
2. **Quy tắc Prisma Migrate:**
   * Chỉ **1 người** đại diện chạy migration khi sửa schema (`npx prisma migrate dev --name <ten_migration>`).
   * Người còn lại kéo code về chỉ chạy: `cd apps/backend && npx prisma generate`.
3. **Build sạch trước khi Push:**
   * Bắt buộc chạy `npm run build:backend` và `npm run build:frontend` pass 100% trước khi tạo Pull Request.
4. **Cập nhật tiến độ:**
   * Ngay sau khi hoàn thành và nghiệm thu xong 1 phiên, chuyển trạng thái tương ứng trong `progress.md` sang `✅ Hoàn thành`.
