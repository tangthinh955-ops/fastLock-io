# 📋 LIVEORDER — PRODUCTION READINESS MASTER PLAN (LỘ TRÌNH 5 ĐỢT SONG SONG)

> **Phiên bản:** v2.1 (Chuyển khoản thật & xác nhận tự động) — Ngày cập nhật: 07/10/2026
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
| **ĐỢT 1<br/>Nền Tảng & Bảo Mật** | **Sửa nền tảng Inbox & Quyền AI/QR hiện có:**<br>• Phân loại nguồn tin (BUYER, SELLER, AI, SYSTEM).<br>• Phân trang tin cũ, kiểm tra logic đọc tin.<br>• Rà soát quyền tạo link VietQR và giới hạn token AI. | **Quyền API/Socket & Che dữ liệu riêng tư:**<br>• Auth/Role Guard cho Product, Order, Livestream.<br>• Server che SĐT (`0912***678`) trước khi broadcast Socket.<br>• Trích `buyerId` từ Socket JWT; cập nhật LiveStudio gửi token. | **Hệ thống an toàn:** Không còn endpoint hở; LiveStudio và Viewer kết nối có JWT; SĐT không bị lộ ở Network tab. |
| **ĐỢT 2<br/>Realtime & Vòng Đời Đơn** | **Inbox Realtime & Seller tiếp quản:**<br>• WebSocket Gateway cho Inbox (`new_message`).<br>• Xử lý Reconnect, chống lặp tin, trạng thái đã đọc.<br>• Cơ chế Seller tiếp quản (tắt AI khi Seller trực tiếp chat). | **Chống lặp đơn & Vòng đời đơn + Hoàn kho:**<br>• Chống tạo đơn trùng khi spam comment (`eventId` unique).<br>• Tách lỗi thông báo/QR khỏi commit đơn.<br>• Chuẩn bị Payment/Order: PAID từ webhook hợp lệ; CANCELLED hoàn kho an toàn, xử lý cạnh tranh thanh toán. | **Luồng chốt mượt:** Chốt đơn không sợ trùng; Inbox chat nảy tức thì; Seller ngắt được AI; Hủy đơn kho tự cộng lại. |
| **ĐỢT 3<br/>Nghiệp Vụ Hai Đầu** | **Buyer Orders & Form người nhận & QR Shop:**<br>• Trang lịch sử mua hàng của Buyer (`/orders`).<br>• Form nhập địa chỉ, snapshot thông tin vào đơn.<br>• QR theo tài khoản Shop đã kết nối; thông báo thanh toán SYSTEM, chống gửi trùng. | **Seller Orders & Báo cáo thống kê:**<br>• Trang quản lý đơn của Seller (`/seller/orders`).<br>• Webhook chuyển khoản thật, đối chiếu tự động; hủy/đối soát ngoại lệ; API snapshot người nhận.<br>• Báo cáo doanh thu thực thu (đơn PAID), Top SP. | **Nghiệp vụ khép kín:** Khách chuyển tiền → webhook hợp lệ → PAID → thông báo Inbox; Seller xử lý đơn và xem báo cáo. |
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
| **S07** | QR theo Shop & Thông báo thanh toán Inbox | 🟦 | `feat/dynamic-vietqr` | QR lấy tài khoản đã liên kết, số tiền VND và mã thanh toán duy nhất từ backend; gắn payment/order vào tin. Sau khi Payment xác nhận, lưu tin SYSTEM và phát room Inbox riêng; chống trùng bằng khóa sự kiện. | Buyer chuyển khoản thật đúng thông tin → nhận xác nhận trong Inbox không reload; retry không trùng QR hoặc thông báo; không gọi AI cho tin SYSTEM. |
| **S08** | Vòng đời Đơn & Webhook chuyển khoản thật | 🟩 | `feat/order-payment-webhook` | Module Payment nhận webhook có xác thực; đối chiếu tiền vào/tài khoản/mã/số tiền; lưu giao dịch và chống xử lý lặp; transaction chuyển PENDING → PAID và tạo nhiệm vụ thông báo. Hủy đơn/hoàn kho chỉ khi điều kiện hợp lệ. | Một giao dịch hợp lệ chỉ thanh toán một đơn một lần; webhook giả/sai shop/sai số tiền không ghi PAID; hủy không hoàn kho đúp; tiền đến sau hủy được đưa vào đối soát. |
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
> Các thay đổi dưới đây là đề xuất thiết kế; cả hai Dev phải thống nhất trước khi chạy migration:

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
}

// Bổ sung vào model DirectMessage:
// - source         MessageSource // Bắt buộc, không default; đã cho phép xóa tin thử nghiệm cũ
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
// - paidAt             DateTime? // Thời điểm backend xác nhận giao dịch hợp lệ
// - confirmedById      String?   // Chỉ dùng khi đối soát thủ công có audit
```

### 4.4. Bổ sung tài khoản ngân hàng & Trạng thái User (Phục vụ S07, S10)
```prisma
// Bổ sung vào model User:
// - bankCode    String? // Mã ngân hàng (VD: ICB, VCB, MB) phục vụ VietQR động
// - bankAccount String? // Số tài khoản ngân hàng của Seller
// - isActive    Boolean @default(true) // Hỗ trợ Admin khóa/mở khóa tài khoản
```

---

## 5. Chuyển khoản thật và xác nhận tự động — phạm vi S07/S08

Mục này thay thế mô tả Seller duyệt thanh toán thủ công trong ma trận Đợt 2/3 ở trên. Thanh toán là tính năng dự kiến, chưa triển khai. Luồng chính xác nhận bằng giao dịch ngân hàng đã được backend kiểm tra; nút frontend, ảnh biên lai và return URL không được tự đặt đơn thành PAID.

### 5.1. Nhà cung cấp và điều kiện triển khai

- Phương án nghiên cứu ban đầu: SePay Webhooks nhận giao dịch tiền vào của tài khoản ngân hàng đã liên kết. Chưa chốt nhà cung cấp cho tới khi kiểm tra ngân hàng thực tế, quyền sử dụng tài khoản, phương thức kết nối, hạn mức/phí và khả năng tích hợp nhiều Seller. Không mặc định điền STK là đã nhận được webhook.
- Mốc đầu tiên: một Shop với tài khoản thật đã kết nối thành công. Sau nghiệm thu mới mở nhiều Shop; mỗi cấu hình nhà cung cấp/tài khoản nhận phải ánh xạ được về đúng Seller. Shop chưa kết nối không được hiển thị khả năng xác nhận tự động.
- Backend có URL HTTPS công khai ổn định cho webhook; Dev2 chuẩn bị môi trường, Dev1 kiểm tra Inbox. Secret nằm ở backend qua môi trường/secret store, không đưa vào client hoặc Git. Xác thực theo tài liệu chính thức; không cấu hình webhook không xác thực.
- Thử payload giả lập trước, sau đó người dùng tự chuyển khoản nhỏ đã thống nhất để nghiệm thu giao dịch thật. Ghi rõ thời gian chờ thực đo; không hứa thông báo tức thì khi nhà cung cấp chậm.

### 5.2. Phân công và thứ tự thực hiện

1. Cả hai thống nhất hợp đồng Payment/Order/DirectMessage và schema; một người chạy migration được duyệt. Không đổi trạng thái dữ liệu đơn cũ thành đã trả tiền.
2. Dev2 lead module `apps/backend/src/modules/payment/` mới và Order: cấu hình nhận tiền theo Shop, tạo yêu cầu thanh toán/mã duy nhất, webhook, đối chiếu, chống lặp, trạng thái và đối soát. `app.module.ts`/schema là [CHUNG].
3. Dev1 lead DirectMessage và Inbox: QR/hướng dẫn lấy từ yêu cầu thanh toán của backend, thông báo SYSTEM liên kết đơn/giao dịch, hiển thị trạng thái và realtime. Dev1 không tự sửa Payment/Order của Dev2.
4. Dev2 hoàn thành xác nhận giao dịch trước; Dev1 tích hợp nhiệm vụ thông báo. Cả hai nghiệm thu giao dịch thật rồi mới mở rộng nhiều Shop và báo cáo S11.

### 5.3. Luồng dữ liệu và tính nhất quán

Order PENDING → backend tạo yêu cầu thanh toán → Inbox nhận QR đúng Shop/số tiền/mã → Buyer chuyển tiền → nhà cung cấp gửi webhook → xác thực và đối chiếu → transaction lưu giao dịch, đổi PAID và lưu nhiệm vụ thông báo → Dev1 lưu DirectMessage SYSTEM → Socket room riêng → Buyer/Seller thấy kết quả.

- Số tiền dùng số nguyên VND (cần migration có kiểm tra từ Float), lấy từ Order server; tài khoản/mã thanh toán được chụp tại lúc tạo yêu cầu, cấu hình Shop đổi không làm sai đơn cũ.
- Chỉ tự xác nhận khi giao dịch tiền vào đã xác thực, đúng tài khoản Shop, đúng một mã thanh toán và đúng số tiền yêu cầu. Bước đầu không cộng dồn nhiều khoản. Thiếu/thừa tiền, sai/thiếu mã hoặc không xác định được đơn → lưu trạng thái cần đối soát, chưa tự ghi PAID.
- Dùng định danh giao dịch duy nhất theo nhà cung cấp/kết nối để chống webhook lặp; không nhận diện đơn chỉ bằng số tiền hoặc tên người chuyển. Chuyển PAID có điều kiện; khóa giao dịch để không thanh toán nhiều đơn.
- Lưu giao dịch, chuyển trạng thái và nhiệm vụ thông báo trong cùng transaction. Nhiệm vụ thông báo có retry/khóa duy nhất; lỗi Inbox không đảo PAID và không yêu cầu khách chuyển lần nữa. Trả ACK theo hợp đồng nhà cung cấp sau khi đã lưu bền vững; không chờ Groq/Socket.
- DirectMessage chứa nội dung: mã đơn, sản phẩm, tiền đã xác nhận; không broadcast giao dịch/SĐT/tài khoản khách vào room live. Tin SYSTEM không đưa vào lịch sử tư vấn AI. Socket chỉ thông báo sau khi DB lưu; reconnect đọc lại dữ liệu đã lưu.
- Đơn đã hủy/hết hạn hoặc đã thanh toán mà nhận thêm tiền → lưu giao dịch cần đối soát; không tự mở đơn, trừ kho lại hay gửi xác nhận lần hai. Hủy đồng thời với webhook phải được kiểm soát trong transaction. Hoàn tiền cần xử lý riêng, không coi hoàn kho là đã hoàn tiền ngân hàng.
- Có tác vụ đối soát qua API nhà cung cấp theo quyền khi webhook thất lạc, dùng lại cùng logic chống lặp. Đối soát thủ công ngoại lệ phải có quyền, bằng chứng, người/thời gian/lý do thao tác; không là nút đánh dấu PAID tùy ý.

### 5.4. Schema dự kiến cần duyệt trước code

- PaymentRequest: Order/Seller, provider/connection, tài khoản snapshot, mã thanh toán duy nhất, số tiền nguyên VND, trạng thái và hạn dùng nếu áp dụng.
- PaymentTransaction: định danh giao dịch provider + connection duy nhất, tiền/tài khoản/mã, thời điểm ngân hàng/nhận webhook, trạng thái đối chiếu và liên kết PaymentRequest. Giới hạn dữ liệu nhạy cảm lưu/log.
- Order: `paidAt`, tham chiếu thanh toán, nguồn xác nhận; `confirmedById` chỉ cho ngoại lệ có audit.
- NotificationTask/Outbox: loại sự kiện, Order/payment, khóa duy nhất, trạng thái gửi và retry. Một `orderId` đơn lẻ không đủ chống trùng các loại tin QR/PAID/CANCELLED khác nhau.
- DirectMessage: nguồn SYSTEM, tham chiếu Order/payment/event và khóa chống trùng. Kết nối ngân hàng: ánh xạ Seller/provider/account và secret được bảo vệ ở server.
- Đây là thiết kế dự kiến; tên file/migration/enum cụ thể chốt trong kế hoạch từng bước. Không chạy migration trong phiên sửa tài liệu.

### 5.5. Nghiệm thu

- Giao dịch thật đúng tiền/mã/tài khoản → đúng đơn PAID, đúng Buyer–Shop nhận một thông báo SYSTEM; dữ liệu báo cáo S11 khớp giao dịch đã đối chiếu.
- Webhook sai xác thực/tiền ra/sai tài khoản/sai mã/thiếu hoặc thừa tiền không tự ghi PAID.
- Gửi lại webhook, nhận đồng thời và replay không tạo thông báo/ghi nhận thanh toán đúp.
- Tiền vào sau hủy/hết hạn, khoản thứ hai và hủy cạnh tranh webhook đi vào xử lý đúng, không hoàn kho/trừ kho thêm sai.
- Backend/Inbox/Socket gián đoạn: giao dịch được lưu, thông báo retry được, reconnect không lặp; đối soát phục hồi webhook thất lạc.

Tài liệu tham khảo: [SePay Webhooks](https://docs.sepay.vn/tich-hop-webhooks.html), [SePay API giao dịch](https://docs.sepay.vn/api-giao-dich.html), [SePay Test Mode](https://docs.sepay.vn/gia-lap-giao-dich.html). Xác minh điều kiện thực tế trước khi đăng ký/tích hợp.

## 6. QUY TRÌNH PHỐI HỢP GIT ĐỂ TRÁNH XUNG ĐỘT

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
