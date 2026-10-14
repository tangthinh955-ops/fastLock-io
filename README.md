# fastLock-io — LiveOrder

Đồ án mô phỏng chốt đơn qua livestream và tư vấn khách hàng trong Inbox riêng bằng AI.

## Luồng nghiệp vụ

- **Chốt đơn:** Buyer gửi comment chứa SKU và số điện thoại → Parser nhận diện → Order tạo đơn, trừ kho nguyên tử → Socket báo đơn → Buyer nhận tin Inbox kèm VietQR.
- **Tư vấn:** Buyer mở Inbox của Shop → AI đọc Knowledge Base riêng của Shop và lịch sử hội thoại → lưu câu hỏi/câu trả lời vào `DirectMessage`.
- **Seller tiếp quản:** Seller gửi tin thủ công hoặc bấm Tiếp quản → hội thoại chuyển HUMAN, AI ngừng trả lời. Seller có thể bật lại AI cho câu hỏi mới.
- Comment thông thường trong livestream được phát realtime, không tự gọi AI.

## Công nghệ và cấu trúc

Monorepo dùng npm workspaces: NestJS, PostgreSQL, Prisma, Socket.io, Groq Qwen; React 19, Vite, MUI và React Router. Docker Compose cung cấp PostgreSQL và Redis; Redis chưa phải thành phần bắt buộc của luồng Inbox hiện tại.

```text
apps/backend/             NestJS API và WebSocket
  prisma/                 Schema, migrations và seed
  src/modules/            Auth, User, Product, Parser, Order, Livestream, AI, DirectMessage
apps/frontend/            React/Vite
  src/pages/              Admin, Auth, Seller, Viewer, Inbox
  src/hooks/              Logic hội thoại và Socket
AGENTS.md                 Quy tắc và phân công Dev 1/Dev 2
plan.md                   Lộ trình triển khai
progress.md               Tiến độ và kết quả kiểm tra
docker-compose.yml        PostgreSQL và Redis cho môi trường local
```

Các bảng chính: `User`, `Product`, `KbEntry`, `Livestream`, `Order`, `OrderItem`, `Conversation`, `DirectMessage`. `Conversation` giữ chế độ AI/HUMAN và version theo cặp Buyer–Seller; tin nhắn phân biệt BUYER/SELLER/AI/SYSTEM.

## Chuẩn bị môi trường

- Node.js **22.12 trở lên** và npm; Node 22.20 đã được dùng để build trong quá trình phát triển.
- Git, Docker Desktop với Docker Compose.
- Groq API key có quyền sử dụng model cấu hình trong `apps/backend/src/modules/ai/ai.service.ts` (hiện là `qwen/qwen3.8-27b`).

### 1. Clone và cài gói

```bash
git clone https://github.com/tangthinh955-ops/fastLock-io.git
cd fastLock-io
npm install
```

### 2. Tạo file môi trường Backend

Từ thư mục gốc, dùng PowerShell:

```powershell
Copy-Item apps/backend/.env.example apps/backend/.env
```

Hoặc dùng CMD:

```cmd
copy apps\backend\.env.example apps\backend\.env
```

Điền `JWT_SECRET` và `GROQ_API_KEY` trong file vừa tạo. Lệnh sao chép dùng cho lần cài mới; không ghi đè `.env` đang có cấu hình của bạn.

| Biến | Công dụng |
|---|---|
| `DATABASE_URL` | Kết nối PostgreSQL; file mẫu khớp Docker Compose local |
| `JWT_SECRET` | Khóa ký/xác thực JWT; phải thay giá trị minh họa |
| `GROQ_API_KEY` | Khóa gọi AI; điền khóa cá nhân, không commit |
| `PORT` | Cổng Backend; mặc định 3001 |

Frontend hiện dùng API cố định `http://localhost:3001` trong `apps/frontend/src/api/client.ts`, nên chưa có `.env.example` frontend. Giữ Backend ở cổng 3001 khi chạy theo hướng dẫn này.

File `.env` thật được Git bỏ qua; chỉ commit `.env.example`. Mật khẩu PostgreSQL trong file mẫu là cấu hình Docker local của đồ án.

### 3. Bật dịch vụ dữ liệu

Chạy từ thư mục gốc:

```bash
docker compose up -d
docker compose ps
```

| Dịch vụ | Địa chỉ từ máy host |
|---|---|
| PostgreSQL | `localhost:5433` → container 5432 |
| Redis | `localhost:6380` → container 6379 |

Compose hiện chỉ chạy hai dịch vụ dữ liệu, chưa tự chạy Backend/Frontend. Dữ liệu PostgreSQL nằm trong Docker volume; không dùng `docker compose down -v` nếu cần giữ dữ liệu.

### 4. Prisma và database

Chạy CLI trong thư mục Backend để đọc đúng `.env` và `prisma.config.ts`:

```bash
cd apps/backend
npx prisma generate
npx prisma migrate status
```

**Database mới, trống:** áp dụng migrations rồi kiểm tra trạng thái:

```bash
npx prisma migrate deploy
npx prisma migrate status
```

**Database đã có dữ liệu:** nếu migrations đã áp dụng hết thì chỉ cần generate. Nếu có migration chưa áp dụng hoặc bảng cũ chưa có lịch sử migration, dừng và đối chiếu cấu trúc/baseline trước khi deploy; không chạy reset để khắc phục nhanh.

Migration `20261007000000_add_message_source` có `DELETE FROM "DirectMessage"`, được tạo để xóa tin thử nghiệm cũ theo quyết định của chủ dự án. Không áp dụng migration này lần đầu trên database có lịch sử Inbox cần giữ. Không chạy lại SQL migration đã áp dụng.

### 5. Tài khoản demo

Seed chỉ tạo tài khoản, không tạo sản phẩm, Knowledge Base hoặc phiên live. Với **database mới, trống**, có thể chạy từ `apps/backend`:

```bash
npx prisma db seed
```

| Vai trò | Email | Mật khẩu mẫu |
|---|---|---|
| ADMIN | `admin@liveorder.com` | `123456` |
| SELLER | `seller@liveorder.com` | `123456` |
| BUYER | `buyer@liveorder.com` | `123456` |

**Giới hạn seed hiện tại:** ID dạng `seller-uuid-001`/`buyer-uuid-001` không phải UUID v4, nên không phù hợp các API Inbox có kiểm tra UUID. Seed phục vụ đăng nhập/xem màn hình, chưa đủ cho demo Inbox đầy đủ. Không chạy lại seed trên database đang dùng vì seed có cập nhật ID tài khoản theo email.

Để chuẩn bị tài khoản demo Inbox, dùng `POST /auth/register` với `email`, `password`, `name`; API tạo BUYER có UUID. Trên database local thử nghiệm, có thể dùng `npx prisma studio` để đổi role của một tài khoản mới thành SELLER; giữ nguyên ID và đăng nhập lại sau khi đổi role. Đây là bước chuẩn bị dữ liệu local, không phải chức năng đổi quyền dành cho người dùng cuối.

### 6. Chạy ứng dụng

Mở hai terminal tại thư mục gốc của dự án:

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

Backend mặc định tại `http://localhost:3001`; mở URL Vite in trong terminal (thường `http://localhost:5173`). Trên Windows nếu PowerShell chặn `npm.ps1`, dùng `npm.cmd`/`npx.cmd` thay cho `npm`/`npx`, không cần thay Execution Policy.

## Màn hình và kịch bản demo

| Role | Đường dẫn |
|---|---|
| Công khai | `/login` |
| ADMIN | `/admin/dashboard` |
| SELLER | `/seller/dashboard`, `/seller/live-studio`, `/seller/ai-settings`, `/seller/inbox` |
| BUYER | `/viewer`, `/inbox` |

1. Seller tạo sản phẩm có SKU và tồn kho; thêm bảng size/chính sách vào Knowledge Base.
2. Seller mở Live Studio, cho phép camera và bắt đầu phiên live. Môi trường live mô phỏng; webcam ở Seller chưa phải truyền video trực tiếp đầy đủ sang Viewer.
3. Buyer mở Viewer bằng một trình duyệt/profile khác, gửi comment chứa SKU có thật và số điện thoại thử nghiệm, ví dụ `SP01 0912345678`.
4. Kiểm tra thông báo đơn ở Seller và tin VietQR trong Inbox Buyer. QR là hướng dẫn chuyển khoản; chưa đồng nghĩa hệ thống đã xác nhận thanh toán.
5. Buyer mở tư vấn riêng, hỏi theo Knowledge Base. Seller Tiếp quản/Bật lại AI; kiểm tra tin hai chiều và Header cập nhật khi cả hai đang mở Inbox.

## Kiểm tra trước khi push

Chạy từ thư mục gốc:

```bash
npm run build:backend
npm run build:frontend
git diff --check
```

Test tập trung Gateway/Service Inbox đã có:

```bash
cd apps/backend
npm test -- --runInBand --runTestsByPath src/modules/direct-message/direct-message.gateway.spec.ts src/modules/direct-message/direct-message.service.spec.ts
```

Không xem kết quả test tập trung là toàn bộ test của dự án. Kiểm thử UI cần hai phiên đăng nhập Buyer/Seller và Groq thật nếu đánh giá câu trả lời AI.

## Trạng thái và việc còn lại

- Đã có Inbox hai chiều, phân trang tin cũ, phân loại nguồn tin, Socket tin mới, xếp hội thoại theo hoạt động và đồng bộ chế độ AI/HUMAN. Xem kết quả kiểm tra và phạm vi nghiệm thu tại [progress.md](progress.md).
- S06 còn đồng bộ đã đọc/badge và tải bù tin khi reconnect; chưa có toast/thông báo toàn ứng dụng ngoài trang Inbox.
- AI hiện đưa toàn bộ Knowledge Base của đúng Shop cùng tối đa 10 tin lịch sử vào prompt; **RAG S19 chưa triển khai**.
- Webhook xác nhận chuyển khoản thật và thông báo PAID còn thuộc kế hoạch S07/S08; không coi ảnh QR là bằng chứng thanh toán thành công.
- Build Frontend hiện còn cảnh báo bundle lớn hơn 500 kB.

Xem [plan.md](plan.md) để theo dõi lộ trình và [AGENTS.md](AGENTS.md) để giữ đúng phạm vi Dev 1/Dev 2.

## Quy trình đầu phiên phát triển

Kiểm tra `git status` và xử lý thay đổi dở dang trước khi pull. Sau đó cập nhật `main`, cài gói nếu có thay đổi dependencies, generate Prisma Client và tạo nhánh riêng:

```bash
git status
git switch main
git pull origin main
npm install
cd apps/backend
npx prisma generate
cd ../..
git switch -c feat/ten-cong-viec
```

Commit/push code trên nhánh tính năng, mở Pull Request về `main`; chỉ đưa các file liên quan vào commit.
