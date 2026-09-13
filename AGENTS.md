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

### 4.7. Tiêu chuẩn Kiến trúc Mã nguồn & Tính Module hóa

**Mục tiêu:** Mã nguồn dễ đọc, dễ mở rộng, phân chia trách nhiệm rõ ràng và hạn chế cập nhật giao diện không cần thiết. Không chia file chỉ để giảm số dòng.

#### 1. Phân chia trách nhiệm

- **Page/Container:** Kết nối các hook, state và dữ liệu của trang; xử lý bố cục tổng thể và truyền dữ liệu/sự kiện cho component con. Được giữ các phần JSX đơn giản phục vụ bố cục.
- **Custom Hook:** Đóng gói một trách nhiệm logic có liên quan, như tải hội thoại, quản lý socket hoặc giữ vị trí cuộn khi phân trang. Không gom mọi logic vào một hook lớn chỉ để làm Page ngắn hơn.
- **Presentational Component:** Chủ yếu nhận dữ liệu qua props và phát sự kiện qua callback. Có thể giữ state giao diện cục bộ đơn giản, như mở menu hoặc bật/tắt phần nội dung.

#### 2. Khi nào cần đánh giá việc phân tách

Phải đánh giá cấu trúc khi gặp một trong các dấu hiệu:

- Component có từ 3 `useEffect` trở lên.
- Có logic phức tạp về socket, debounce, phân trang hoặc đồng bộ vị trí cuộn.
- Một file vượt khoảng 300 dòng.
- Một khối giao diện có trách nhiệm độc lập, props rõ ràng hoặc xuất hiện nhiều lần.

Đây là tín hiệu đánh giá, không phải quy tắc tách máy móc theo số dòng.

Logic phức tạp phải được cô lập theo trách nhiệm: dùng custom hook khi phụ thuộc vòng đời React; dùng hàm thuần khi chỉ biến đổi hoặc tính toán dữ liệu.

Tách component khi việc đó cải thiện rõ khả năng đọc, tái sử dụng hoặc quản lý cập nhật giao diện. Không tách chỉ vì có thể đặt tên cho một khối JSX.

#### 3. Tái sử dụng có căn cứ

- Khi UI hoặc logic trùng lặp ở từ 2 nơi trở lên, phải đánh giá việc dùng chung.
- Tách dùng chung khi các nơi có cùng ý nghĩa nghiệp vụ và hành vi tương đồng.
- Không xây dựng abstraction chỉ dựa trên khả năng có thể tái sử dụng trong tương lai.
- Với BUYER và SELLER, có thể dùng chung phần hiển thị như bong bóng tin nhắn hoặc thẻ VietQR; giữ riêng logic quyền hạn và hành động khi chúng khác nhau.
- Không tạo component chung với quá nhiều cờ điều kiện để phục vụ các luồng khác biệt.

#### 4. Hiệu năng và vòng đời

- Đặt state ở phạm vi nhỏ nhất cần sử dụng và tránh lưu state có thể suy ra trực tiếp từ dữ liệu hiện có.
- Giới hạn phạm vi lắng nghe socket hoặc dữ liệu vào nơi cần thiết.
- Effect đăng ký listener, timer hoặc tác vụ bất đồng bộ phải xử lý cleanup và phản hồi lỗi thời khi phù hợp.
- Tách component hoặc custom hook không được xem là bằng chứng đã tối ưu re-render.
- Chỉ dùng `memo`, `useMemo`, `useCallback` khi có lý do cụ thể; không áp dụng hàng loạt theo thói quen.

#### 5. Tránh chia nhỏ quá mức

- Giữ các đoạn hiển thị ngắn, dễ hiểu và chỉ dùng cục bộ trong component hiện tại.
- Độ dài dưới 20 dòng không cấm việc tách nếu phần đó thực sự được dùng chung hoặc có trách nhiệm độc lập.
- Ưu tiên cấu trúc hiện có của dự án. Không thêm tầng trung gian hoặc dependency chỉ để phục vụ refactor.

#### 6. Yêu cầu trong kế hoạch và phạm vi sở hữu

Với tính năng giao diện mới hoặc refactor cấu trúc đáng kể, kế hoạch ở mục 4.2 phải có:

- Component Tree dự kiến.
- Trách nhiệm của Page, component con và các hook chính.
- Nơi sở hữu state và luồng truyền dữ liệu/sự kiện.
- Phần dùng chung, nếu đã có nhu cầu cụ thể.

Với thay đổi nhỏ, chỉ cần mô tả component bị tác động; không bắt buộc dựng lại toàn bộ cây.

Component và hook được tách ra vẫn tuân theo quyền sở hữu của tính năng gốc. File phục vụ nhiều phạm vi sở hữu được xem là [CHUNG].

Mục 4.7 không thay thế quy trình xin xác nhận ở mục 4.2–4.3. Nếu phát hiện nhu cầu refactor ngoài kế hoạch đã duyệt, chỉ đề xuất và chờ xác nhận trước khi thực hiện.