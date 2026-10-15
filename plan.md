# 📋 LIVEORDER — PRODUCTION READINESS MASTER PLAN (LỘ TRÌNH 5 ĐỢT SONG SONG)

> **Phiên bản:** v2.3 (Ưu tiên S19 song song và làm rõ dependency/trạng thái) — Ngày cập nhật: 16/10/2026
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

### 1.2. Thứ tự ưu tiên từ trạng thái hiện tại — cập nhật 16/10/2026

- **S01–S19 là mã đầu việc, không phải thứ tự bắt buộc.** Năm đợt bên dưới nhóm mục tiêu nghiệm thu; công việc có thể làm song song khi đã có dependency cần thiết. Mỗi đầu việc vẫn triển khai từng bước và kiểm tra theo phạm vi được duyệt.
- **Ưu tiên hiện tại của Thịnh:** Bắt đầu S19 bằng thử nghiệm embedding ngày 1 theo mục 7.6; chọn model, cách lưu vector và xác nhận lại mục tiêu 7 ngày bằng số liệu trên máy demo. Chưa coi S19 đang triển khai hoặc hoàn thành chỉ vì đã chốt kế hoạch.
- **Kỳ làm song song:** Ưu tiên quyền API/Socket, danh tính Buyer và che SĐT trong S01/S03/S04; xử lý các lỗi đã ghi nhận về chọn SKU, kiểm tra Order đúng Shop/live và tính nhất quán đơn–QR. Hai người thống nhất điểm tích hợp Product của S19 và các file [CHUNG] trước khi sửa.
- **Nền tảng để bắt đầu S19:** Code S05 và S06 A/B/C1 đã có gồm Inbox, lịch sử, takeover, Socket tin mới và mode. S19 không phải chờ hoàn thành reconnect/unread của S06, Payment S07/S08 hoặc toàn bộ S01–S18; các phần còn lại vẫn được theo dõi riêng. Các luồng nền phải được kiểm thử lại khi tích hợp RAG, không coi code đã có là đã nghiệm thu trình duyệt.
- **Sau thử nghiệm ngày 1:** Thịnh triển khai S19 theo các bước retrieval → tích hợp/fallback → kiểm thử/A-B/báo cáo; Kỳ phối hợp Product theo hợp đồng đã duyệt. Nếu model, hiệu năng hoặc phương án lưu chưa phù hợp thì chốt lại trước khi viết phần tích hợp.
- **Các đầu việc còn lại đi theo dependency:** S07 nghiệm thu thông báo thanh toán sau khi có Payment/Order của S08; S11 dùng dữ liệu PAID đã xác nhận. Các màn Orders/thông tin người nhận ở Đợt 3 cần chốt nhiệm vụ và owner cụ thể trước khi triển khai, không mặc định đã được bao gồm trong S07/S08/S11.
- **Hai mức nghiệm thu:** S19 đạt theo mục 7.5 về retrieval, dữ liệu, fallback, takeover và số liệu A/B. Nghiệm thu toàn hệ thống còn cần các lỗi bảo mật/chốt đơn được xử lý, phần còn lại S06 hoàn thiện và kịch bản Buyer–Seller/đơn–thanh toán đạt; S19 hoàn thành không tự đánh dấu các phần đó hoàn thành.

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

## 3. BẢNG PHÂN BỔ 19 PHIÊN LÀM VIỆC CHI TIẾT

> **Ký hiệu:** 🟦 Thịnh (Dev 1 Lead) | 🟩 Kỳ (Dev 2 Lead)

> **Trạng thái:** Tổng hợp từ `progress.md` và lần rà soát 15/10/2026; code đã có/kiểm tra tự động đạt không đồng nghĩa đã nghiệm thu toàn bộ. Cột dependency chỉ ra điều kiện hoặc phần cần phối hợp, không yêu cầu hoàn thành tuần tự toàn bộ các phiên được nhắc tới. Các tên nhánh là gợi ý theo đầu việc; phiên cập nhật tài liệu hiện tại giữ nhánh đang dùng theo yêu cầu người dùng.

| Phiên | Tên phiên làm việc | Lead | Nhánh Git | Nhiệm vụ kỹ thuật cốt lõi | Tiêu chuẩn hoàn thành (DoD) | Trạng thái hiện tại | Dependency / phối hợp |
|:---:|:---|:---:|:---|:---|:---|:---|:---|
| **S01** | Vá Auth Guard Controller & Quyền tài nguyên | 🟩 | `fix/auth-guards-dev2` | Gắn `@UseGuards(JwtAuthGuard, RolesGuard)` cho Product, Order, Livestream; lấy `userId` từ token; kiểm tra quyền xem chi tiết live và đơn shop. | Không token → 401; Buyer tạo/sửa SP → 403; truy cập chéo shop bị chặn. | ⏳ Chưa vá Guard theo phiên | Auth/JWT và hợp đồng quyền tài nguyên; phối hợp LiveStudio gửi token. |
| **S02** | Chuẩn hóa Seed UUID & Env & Fix lỗi | 🟨 | `fix/schema-seed-env` | Giữ nguyên cú pháp Prisma nếu chạy tốt; chuẩn hóa Seed sang UUID cố định; tạo 3 file `.env.example`; LiveStudio dùng `apiClient`. | Chạy lại seed không làm gãy quan hệ dữ liệu cũ; gọi API seed user không bị lỗi 400. | 🔄 Có env backend/README; seed UUID còn thiếu | Kiểm tra DB hiện hữu trước đổi seed; phối hợp LiveStudio [KỲ]. |
| **S03** | Bảo mật danh tính Socket & Quyền sự kiện | 🟩 | `fix/socket-auth-identity` | Trong `LivestreamGateway`: Kiểm tra quyền ở từng sự kiện `join_room`, `send_comment`; bắt buộc gán `buyerId = client.data.user.userId`. | Client gửi ID giả mạo trong payload vẫn ghi nhận đúng user trong JWT. | ⏳ Chưa vá danh tính/quyền sự kiện; đã có JWT handshake | Hợp đồng Auth/JWT; phối hợp HTTP/Socket và danh tính Buyer. |
| **S04** | Hoàn thiện Nổ đơn E2E & Server Mask Phone | 🟩🟦 | `feat/viewer-order-streamline` | **Kỳ (Server):** Che SĐT thành `0912***678` trước khi broadcast.<br>**Thịnh (Client):** Bắt `new_order`, popup nổ đơn đúng cho Buyer sở hữu. | Comment trên Live che SĐT ngay từ Network tab; popup nổ đơn chuẩn cho cả 2 bên. | 🔄 Có new_order; còn mask SĐT/E2E Buyer | Danh tính đúng từ S03 và hợp đồng payload công khai/riêng. |
| **S05** | Luồng Tư vấn AI Inbox & Seller tiếp quản | 🟦 | `feat/inbox-ai-consult-flow` | Nút "Tư vấn Shop" từ Viewer mở thẳng Inbox Seller; AI đọc KB tư vấn; không gọi AI trên Live; thêm cờ Human Takeover ngắt AI khi Seller chat. | Chat Live chỉ nổ đơn; Inbox tư vấn size chính xác theo KB; Seller chat thì AI im lặng. | 🟡 Code A/B đạt kiểm tra tự động; chờ UI/Groq thật | Auth, KB và DirectMessage; là nền đã có để bắt đầu S19. |
| **S06** | WebSocket Realtime Inbox & Deduplication | 🟦 | `feat/inbox-realtime-socket` | Tạo `DirectMessageGateway`; hỗ trợ Reconnect, chống nhận tin trùng qua messageId; đồng bộ trạng thái đọc; phân biệt 4 nguồn tin. | 2 bên chat thấy tin nảy tức thì; AI trả lời hiện bong bóng ngay; không nhân đôi tin khi lag. | 🔄 A/B/C1 đã có; còn reconnect/unread và nghiệm thu | S05 và HTTP lịch sử; phần còn lại không chặn thử nghiệm S19. |
| **S07** | QR theo Shop & Thông báo thanh toán Inbox | 🟦 | `feat/dynamic-vietqr` | QR lấy tài khoản đã liên kết, số tiền VND và mã thanh toán duy nhất từ backend; gắn payment/order vào tin. Sau khi Payment xác nhận, lưu tin SYSTEM và phát room Inbox riêng; chống trùng bằng khóa sự kiện. | Buyer chuyển khoản thật đúng thông tin → nhận xác nhận trong Inbox không reload; retry không trùng QR hoặc thông báo; không gọi AI cho tin SYSTEM. | ⏳ Chưa có QR theo Shop/thông báo PAID | Hợp đồng Payment/Order của S08, schema và Socket Inbox S06. |
| **S08** | Vòng đời Đơn & Webhook chuyển khoản thật | 🟩 | `feat/order-payment-webhook` | Module Payment nhận webhook có xác thực; đối chiếu tiền vào/tài khoản/mã/số tiền; lưu giao dịch và chống xử lý lặp; transaction chuyển PENDING → PAID và tạo nhiệm vụ thông báo. Hủy đơn/hoàn kho chỉ khi điều kiện hợp lệ. | Một giao dịch hợp lệ chỉ thanh toán một đơn một lần; webhook giả/sai shop/sai số tiền không ghi PAID; hủy không hoàn kho đúp; tiền đến sau hủy được đưa vào đối soát. | ⏳ Chưa có Payment/webhook/vòng đời đơn | Quyền tài nguyên, Order đúng Shop/live; kết nối một Shop/HTTPS và schema [CHUNG]. |
| **S09** | Trang Đăng ký Tài khoản mới (Register Page) | 🟦 | `feat/register-page` | Tạo `RegisterPage.tsx` có validate form; nối API `POST /auth/register`; đăng ký xong tự động đăng nhập và chuyển hướng vào Viewer. | Người dùng mới tự tạo tài khoản thành công mà không cần seed hay tạo tay trong DB. | ⏳ Chưa ghi nhận triển khai giao diện đăng ký | API Auth đăng ký/đăng nhập và routing [CHUNG]; không chặn S19. |
| **S10** | Admin CRUD User & Khóa tài khoản tức thì | 🟦 | `feat/admin-user-management` | Thêm `isActive` vào User; `JwtStrategy` chặn user bị khóa; Admin UI có nút Đổi Role, Khóa/Mở khóa tài khoản có xác nhận. | Khóa user → user đó lập tức bị logout và chặn mọi request ngay lập tức. | ⏳ Chưa ghi nhận quản lý khóa/đổi role | Schema User/Auth [CHUNG]; phối hợp quyền HTTP và Socket S03/S06. |
| **S11** | Dashboard Thống kê Doanh thu & Báo cáo Seller | 🟩 | `feat/seller-analytics` | API & UI thống kê: Doanh thu thực thu (chỉ tính đơn PAID), Số đơn theo trạng thái, Top 5 sản phẩm bán chạy nhất trong shop. | Số liệu báo cáo doanh thu và top bán chạy khớp 100% với dữ liệu database. | ⏳ Chưa ghi nhận triển khai thống kê | Dữ liệu PAID hợp lệ từ S08 và quyền xem dữ liệu Shop. |
| **S12** | Upload Ảnh Thật & Phân trang Server-side | 🟩 | `feat/product-image-upload` | Multer upload file ảnh lên server; phục vụ file tĩnh; phân trang API `GET /products` (10 SP/trang) kèm tìm kiếm SKU/tên. | Seller tải ảnh từ máy tính hiển thị chuẩn trên Dashboard và màn hình xem Live. | ⏳ Chưa ghi nhận upload/phân trang | Quyền Product S01, nơi lưu ảnh và hợp đồng API với các màn dùng sản phẩm. |
| **S13** | Swagger API Documentation chuẩn OpenAPI | 🟦 | `feat/swagger-docs` | Thịnh lead setup Swagger UI tại `/api/docs`; cả 2 dev gắn decorator `@ApiTags`, `@ApiOperation`, `@ApiProperty` cho module của mình. | Truy cập web test API trực quan, đầy đủ tài liệu phục vụ hội đồng chấm đồ án. | ⏳ Chưa ghi nhận triển khai Swagger | Hợp đồng API từng module; cập nhật dần, không phải chờ mọi phiên. |
| **S14** | Unit Test Core & Benchmark Aho-Corasick | 🟩 | `test/core-unit-tests` | Test Aho-Corasick, Parser, Atomic Stock; viết script đo thời gian bóc SKU thực tế so với Regex trên tập 100–1.000 SKU để lấy số liệu vào slide. | Chạy `npm run test` pass 100%; có số liệu thực nghiệm trung thực đưa vào báo cáo. | ⏳ Chưa ghi nhận test/benchmark core theo phiên | Core/Parser/Order đúng nghiệp vụ; PostgreSQL cho kiểm tra cạnh tranh kho. |
| **S15** | Unit Test AI, DirectMessage & Frontend Tests | 🟦 | `test/ai-dm-frontend` | Test AiService (mock Groq, test 20 KB), test DirectMessage, test Auth Guard Frontend (ProtectedRoute, AuthContext session). | Test AI kiểm soát tốt token; test Guard chặn đúng role; không có lỗi tiềm ẩn. | 🔄 Có test Service/Gateway; backend 47/49 ca ở lần rà soát | S05/S06; bổ sung kiểm thử tương ứng S19 khi có RAG và bộ tình huống. |
| **S16** | Dockerfile Multi-stage & Compose Production | 🟩 | `devops/docker-production` | Kỳ lead viết Dockerfile tối ưu cho Backend & Frontend (Nginx proxy); cập nhật `docker-compose.yml` gồm Postgres, Redis, Backend, Frontend. | Chạy `docker compose up --build` khởi động toàn bộ hệ thống mượt mà trên máy mới. | ⏳ Chưa đóng gói app; Compose mới có DB/Redis | Build/startup, cấu hình môi trường; cache model local nếu đóng gói S19. |
| **S17** | GitHub Actions CI Pipeline tự động hóa | 🟩 | `devops/github-actions-ci` | Kỳ lead tạo workflow GitHub Actions: Tự động chạy Lint check → Type check (`tsc --noEmit`) → Chạy Test → Chạy Build khi có PR vào `main`. | PR tự động kiểm tra, báo tích xanh mới cho merge, loại bỏ hoàn toàn lỗi gãy build. | ⏳ Chưa ghi nhận CI | Lệnh build/test/check chạy ổn; có thể làm sớm, không chờ S16. |
| **S18** | Security Hardening & Hoàn thiện README Demo | 🟦 | `chore/security-readme-final` | Thịnh lead audit bảo mật: Bật Helmet, chặn CORS mở, áp Rate Limit Redis, xóa `killPort()`, viết tài liệu `README.md` và kịch bản demo. | `npm audit` sạch lỗ hổng; README có sơ đồ kiến trúc hoàn chỉnh và kịch bản demo mượt. | 🔄 Có README/env; hardening/demo chưa xong | Phối hợp file [CHUNG]/DevOps và kết quả nghiệm thu các luồng. |
| **S19** | PA2 — RAG local từ KB + Product & Báo cáo thực nghiệm (mục tiêu 7 ngày) | 🟦🟩 | `codex/inbox-rag` | Thịnh lead embedding local bằng Transformers.js; truy xuất KbEntry + tên/SKU Product đúng sellerId, lấy giá/kho từ DB lúc trả lời; top-k có lọc mức liên quan và tag nguồn vào Groq. Kỳ phụ trách tích hợp cập nhật Product; schema/migration [CHUNG] chốt trước code. Giữ lịch sử, takeover, Socket và API contract; fallback full-KB, đo A/B trên ít nhất 20 tình huống. Chi tiết tại mục 7. | Không lẫn Shop/chốt nhầm SKU; hàng không có thì hỏi lại hoặc báo không tìm thấy; dữ liệu sửa/xóa không còn trong retrieval; không phát AI lỗi thời sau takeover. Có số liệu chất lượng/token/độ trễ/fallback thực đo, build/test phù hợp đạt và demo ổn định. | ⏳ Đã chốt PA2; ưu tiên bắt đầu thử nghiệm ngày 1 | Code S05 + S06 A/B/C1; phối hợp Product, chốt model/lưu vector; không chờ toàn bộ S01–S18. |

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

---

## 7. S19 — PA2: RAG local từ KbEntry + Product & Báo cáo thực nghiệm

PA2 thay thế phạm vi S19 chỉ truy xuất KbEntry trước đây. Mục tiêu là truy xuất dữ liệu đúng Shop theo ngữ nghĩa, bổ sung giá/tồn kho từ database tại thời điểm trả lời và đo hiệu quả so với đưa toàn bộ dữ liệu vào prompt. Không mặc định RAG chính xác hơn hoặc nhanh hơn trước khi có số liệu.

| Phụ trách | Thời gian | Phạm vi |
|---|---|---|
| **Thịnh — Dev 1, lead S19** | **Mục tiêu 7 ngày, gồm báo cáo/demo; xác nhận sau thử nghiệm ngày 1** | Embedding local, retrieval, cập nhật KbEntry, tích hợp prompt/fallback, kiểm thử và đo A/B. |
| **Kỳ — Dev 2** | Phối hợp trong S19 | Tích hợp tạo/sửa/xóa Product với cơ chế cập nhật chỉ mục đã thống nhất; giữ hành vi lưu sản phẩm hiện có. |
| **[CHUNG]** | Chốt trước khi viết code | Cách lưu vector, dependency/module integration và schema/migration nếu cần. Một người đại diện chạy migration đã duyệt. |

### 7.1. Công nghệ và nguồn dữ liệu

- **Embedding local:** Dùng `@huggingface/transformers` (Transformers.js), chọn model embedding đa ngôn ngữ có bản tương thích và thử chất lượng tiếng Việt trên máy demo. Chốt model ID/revision, kiểu lượng tử, pooling/normalization và kích thước vector trước code. Khoảng 120 MB là ước lượng, cần đo dung lượng tải và RAM thực tế.
- **Vận hành:** Một pipeline embedding dùng chung, giữ cache model bền vững để tái sử dụng sau restart/deploy; chuẩn bị đủ model/tokenizer/runtime cần thiết và kiểm tra embedding chạy khi mất mạng. Groq vẫn là API duy nhất cho sinh câu trả lời; toàn bộ hệ thống tư vấn vẫn cần mạng để gọi Groq.
- **KbEntry:** Embed `keyword + answer`, giữ nguyên dữ liệu gõ tay và `sellerId`.
- **Product:** Embed tên + SKU; giữ `productId`, `sellerId` và loại nguồn để lấy lại dữ liệu gốc. Không đưa giá/tồn kho vào vector. Chỉ lấy giá/kho của sản phẩm còn tồn tại và thuộc đúng Shop từ DB lúc dựng prompt.
- **Giới hạn phạm vi:** Không thêm PDF, UI mới, dịch vụ embedding bên ngoài hoặc database vector chuyên dụng trong S19 này.

### 7.2. Luồng truy xuất và trả lời

Buyer gửi Inbox → giữ luồng lưu/phát tin BUYER hiện có → nếu HUMAN thì dừng AI → dựng truy vấn từ câu hỏi và ngữ cảnh cần thiết → embed local → chọn ứng viên đúng sellerId → cosine + kiểm tra SKU/mức liên quan → tối đa 3–5 mục phù hợp → đọc dữ liệu gốc và giá/kho hiện tại → gắn tag [SẢN PHẨM]/[KIẾN THỨC] → Groq sinh trả lời → kiểm tra mode/version hiện có → lưu/phát tin AI.

- Dùng lịch sử để hiểu câu nối tiếp như “áo đó còn không?”, nhưng không coi lịch sử là kiến thức có thẩm quyền hoặc tự đoán sản phẩm chưa rõ.
- SKU được nhắc rõ phải kiểm tra chính xác trong đúng Shop; không dùng cosine để thay thế SKU bằng sản phẩm có mã gần giống. S19 không thay đổi parser/chốt đơn livestream của Kỳ.
- Top-k là giới hạn tối đa, không ép lấy đủ mục. Ngưỡng liên quan và cách phân bổ Product/KB được chọn qua tập thử riêng; câu ngoài dữ liệu phải hỏi lại hoặc báo không có thông tin phù hợp. Tránh một loại nguồn chiếm hết kết quả khi câu hỏi cần cả sản phẩm và chính sách.
- KB quy định kiến thức/chính sách; dữ liệu Product từ DB là nguồn giá/kho. Điều chỉnh prompt có chủ đích để cho phép báo snapshot giá/kho này, không tự xác nhận đơn hoặc thanh toán. Tồn kho lúc trả lời không bảo đảm đặt hàng thành công; Order vẫn quyết định bằng transaction trừ kho.

### 7.3. Lưu vector, dữ liệu cũ và cập nhật chỉ mục

- **Quyết định cần chốt trước code:** Lưu vector trong RAM hay lưu bền vững trong PostgreSQL. RAM không bắt buộc migration; nếu chọn PostgreSQL thì lập kế hoạch schema/migration [CHUNG], không tự thêm cột vào KbEntry/Product.
- Chỉ mục cần nhận diện nguồn/id/sellerId, nội dung đã embed và model/version. Nội dung hoặc model thay đổi thì vector cũ không được tái sử dụng; toàn bộ vector dùng chung để chấm cosine phải tương thích.
- **Dữ liệu cũ:** Tự embed bù lúc retrieve đầu tiên của Shop, theo lô có giới hạn và chống nhiều request embed trùng. Không cần script dọn/xóa dữ liệu. Ghi nhận thời gian lần đầu riêng và có timeout/fallback để câu hỏi không bị treo.
- **Cập nhật:** KbEntry tạo/sửa nếu có/xóa; Product tạo/sửa tên hoặc SKU/xóa phải cập nhật hoặc vô hiệu hóa chỉ mục sau khi dữ liệu được lưu thành công. Giá/kho đổi không cần embed lại. Trước khi dùng kết quả, kiểm tra nguồn vẫn tồn tại/thuộc Shop và nội dung chưa lỗi thời; thiếu vector hoặc vector cũ thì embed bù theo cơ chế trên.
- Hook trong `product.service.ts` chỉ là phần gọi tích hợp, không ước lượng toàn bộ cơ chế bằng “5 dòng”. Lỗi embedding không làm API báo lưu sản phẩm thất bại khi dữ liệu đã commit; để lại khả năng embed bù ở lần retrieve sau. Tránh phụ thuộc vòng giữa Product và AI.

### 7.4. Fallback và phần giữ nguyên

- Model/embedding/retrieval lỗi hoặc quá timeout → dùng luồng full-KB hiện có của đúng Shop. Không đưa vector/dữ liệu của Shop khác vào fallback.
- Full-KB hiện tại không có Product: khi fallback không tự khẳng định giá/kho nếu chưa có dữ liệu đáng tin cậy. Phân biệt lỗi kỹ thuật với câu hỏi không có dữ liệu; câu ngoài dữ liệu không tự động kích hoạt full-KB chỉ để cố tìm câu trả lời.
- Giữ API contract, lịch sử hội thoại, nguồn tin, Socket và cơ chế HUMAN/mode/version. Embedding/Groq nằm ngoài transaction; phản hồi AI vẫn phải bị loại khi Seller đã tiếp quản.
- Ghi nhận RAG/fallback và lý do để đo đạc; không tính câu fallback là kết quả retrieval thành công.

### 7.5. Đo A/B và nghiệm thu

- **Hai đối chiếu:** (1) AI hiện tại full-KB và PA2 để đánh giá nâng cấp tổng thể; (2) full-context KB + Product và PA2 trên cùng nguồn dữ liệu để đánh giá riêng tác động của retrieval. Giữ cùng model sinh, cấu hình, dữ liệu và ngữ cảnh; không kết luận RAG tốt hơn chỉ vì PA2 được cấp thêm Product.
- Ít nhất 20 tình huống có đáp án/mục nguồn kỳ vọng: paraphrase tiếng Việt, câu nối tiếp, SKU gần giống, sản phẩm không tồn tại, câu ngoài KB, câu cần nhiều nguồn, hai Shop có dữ liệu tương tự, đổi giá/kho, sửa/xóa nguồn, embedding lỗi và Seller tiếp quản khi AI đang chờ. Chọn ngưỡng/top-k bằng tập thử riêng trước khi chạy tập đánh giá.
- Đo độ đúng/đủ, tỷ lệ lấy đúng nguồn, khả năng hỏi lại/từ chối, token đầu vào thực tế, thời gian embedding/retrieval/Groq và tổng thời gian trả lời, tỷ lệ fallback. Tách lần đầu tải model/embed bù và các lần đã có cache; ghi rõ máy/model/cấu hình/số lần chạy.
- Nghiệm thu: không lẫn Shop; không thay SKU chính xác bằng sản phẩm khác; sửa/xóa nguồn không còn xuất hiện dưới dạng dữ liệu cũ; giá/kho từ DB đúng thời điểm đọc; fallback hoạt động; AI không lưu/phát sau takeover; build/test phù hợp đạt; demo Buyer/Seller và embedding offline thành công.
- Báo cáo trung thực cả trường hợp PA2 giảm token nhưng không tăng độ chính xác hoặc tăng độ trễ. Câu chuyện báo cáo: “Truy xuất top-k theo ngữ nghĩa từ kiến thức và sản phẩm đúng Shop, bổ sung dữ liệu biến động từ DB, thay vì nhét toàn bộ dữ liệu vào prompt.”

### 7.6. Lịch và điều kiện triển khai

- **Ngày 1:** Thử embedding trên máy demo, kiểm tra tiếng Việt/offline, đo dung lượng/RAM/độ trễ; chuẩn bị baseline và tập tình huống. Chốt cách lưu vector, hợp đồng với Kỳ và lịch khả thi.
- **Ngày 2–3:** Triển khai embedding/retrieval, embed bù/cập nhật nguồn, dữ liệu Product sống, prompt và fallback trong phạm vi đã duyệt.
- **Ngày 4–5:** Kiểm thử cách ly Shop/SKU/lịch sử/takeover/cập nhật nguồn, đo A/B và sửa lỗi trong phạm vi.
- **Ngày 6–7:** Báo cáo, slide, build/test và demo. Nếu thử nghiệm ngày 1 hoặc phối hợp schema/Product chưa đạt thì điều chỉnh lịch trước, không cắt nghiệm thu để giữ mốc 7 ngày.
- **Dependency:** Tận dụng code S05, S06 A/B/C1 đã có; có thể bắt đầu S19 trước khi xong reconnect/unread của S06 và không phải chờ Payment hoặc toàn bộ S01–S18. Kiểm thử lại các luồng nền khi tích hợp; thay đổi Product cần phối hợp Kỳ, schema/module integration [CHUNG] cần duyệt. Kết quả đánh giá bổ sung S15, tài liệu bổ sung S18. Kỳ xử lý các lỗi P1 chốt đơn song song; PA2 không thay thế việc sửa các lỗi đó.
- **Nghiệm thu riêng:** Hoàn thành S19 theo mục 7.5 chỉ xác nhận tính năng RAG và thực nghiệm. Nghiệm thu demo chung tiếp tục phụ thuộc sửa lỗi bảo mật/chốt đơn, hoàn thiện các luồng liên quan và kiểm thử Buyer–Seller như mục 1.2.
- **Trước code:** Đọc `progress.md`, lập danh sách [CREATE]/[MODIFY] cụ thể và xin xác nhận theo AGENTS.md. Kỳ phụ trách Product; schema và file tích hợp [CHUNG] cần duyệt. Chưa cài dependency, sửa code hoặc chạy migration trong phiên cập nhật tài liệu này.
- **Trạng thái:** Đã chốt hướng PA2 ở mức kế hoạch; chưa triển khai/chưa nghiệm thu. Cách lưu vector và model cụ thể còn phải chốt trước code. Mục này thay thế mô tả S19 cũ; mục tiêu 7 ngày gồm báo cáo/demo có điều kiện như trên.

Tham khảo kỹ thuật: [Transformers.js — Node.js, model cache và local models](https://huggingface.co/docs/transformers.js/v3.8.1/tutorials/node).
