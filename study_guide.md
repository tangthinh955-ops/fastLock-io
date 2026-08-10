# TÀI LIỆU HỌC TẬP DỰ ÁN: LIVE-COMMERCE ENGINE

Tài liệu này tổng hợp các kiến thức cốt lõi, giải thích chi tiết ý nghĩa các câu lệnh, cấu hình, và các bài học kinh nghiệm thu được trong quá trình xây dựng dự án.

---

## 📘 CHỦ ĐỀ 1: KIẾN TRÚC MONOREPO & WORKSPACES

### 1. Monorepo là gì?
*   **Định nghĩa:** Là mô hình lưu trữ nhiều dự án riêng biệt (ví dụ: `apps/frontend` và `apps/backend`) trong cùng một Repository duy nhất.
*   **Lợi ích:**
    *   **Quản lý tập trung:** Dễ dàng kiểm soát các phiên bản mã nguồn, chỉ cần một cấu hình Git chung.
    *   **Chia sẻ thư viện dễ dàng:** Các dự án con có thể dùng chung cấu hình TypeScript, Linter, hoặc các thư viện dùng chung (Shared Libraries).
    *   **Tiết kiệm ổ đĩa:** Tránh việc cài đặt trùng lặp các gói thư viện nặng (như React, NestJS) ở nhiều nơi.

### 2. Ý nghĩa cấu hình `package.json` gốc
```json
{
  "name": "live-commerce-engine",
  "private": true,
  "workspaces": [
    "apps/*"
  ]
}
```
*   `"private": true`: Đảm bảo an toàn, ngăn không cho lệnh `npm publish` vô tình đẩy mã nguồn của toàn bộ dự án lên Registry npm công khai.
*   `"workspaces": ["apps/*"]`: Đăng ký tất cả các thư mục con bên trong thư mục `apps/` là các dự án con (Workspaces). Khi bạn gõ `npm install` tại thư mục gốc:
    1. npm sẽ quét các file `package.json` của các app con.
    2. npm tải toàn bộ thư viện cần thiết và đặt tập trung tại thư mục `node_modules` ở thư mục gốc.
    3. npm tạo ra các đường dẫn liên kết ảo (Symlink) trỏ từ `node_modules` gốc vào các workspace để các app con vẫn hiểu được thư viện của riêng mình.

---

## 🐳 CHỦ ĐỀ 2: CONTAINER HÓA DỊCH VỤ VỚI DOCKER COMPOSE

### 1. Tại sao dùng Docker Compose?
Thay vì phải tự tải và cài đặt phần mềm PostgreSQL và Redis lên hệ điều hành (gây nặng máy, cấu hình cổng phức tạp), Docker Compose giúp khởi chạy 2 dịch vụ này một cách biệt lập trong "Container" chỉ bằng một lệnh duy nhất.

### 2. Giải thích chi tiết `docker-compose.yml`
*   `version: '3.8'`: Khai báo phiên bản cú pháp của Docker Compose được sử dụng.
*   `services`: Định nghĩa danh sách các container dịch vụ:
    *   **`postgres` (PostgreSQL 15)**: Hệ quản trị CSDL quan hệ chính để lưu trữ dữ liệu bền vững (Người dùng, sản phẩm, đơn hàng).
        *   `image: postgres:15-alpine`: Alpine là phiên bản Linux siêu nhẹ (chỉ khoảng vài chục MB), giúp tối ưu bộ nhớ.
        *   `ports - "5432:5432"`: Ánh xạ cổng `5432` của container ra cổng `5432` trên máy thật của bạn để ứng dụng Backend NestJS có thể kết nối vào.
    *   **`redis` (Redis 7)**: CSDL dạng key-value hoạt động trực tiếp trên RAM (In-memory database) siêu tốc.
        *   **Ứng dụng:** Dùng để làm bộ nhớ đệm (Cache) tăng tốc độ đọc dữ liệu, quản lý khóa phân tán (Distributed Locks) ngăn lỗi chốt lố hàng (Overselling), và làm hàng đợi trung chuyển BullMQ.
*   `volumes`: Khai báo vùng đệm dữ liệu. Giúp lưu trữ dữ liệu của CSDL trên ổ đĩa vật lý của máy thật. Nhờ vậy, khi bạn tắt container (`docker compose down`), dữ liệu trong PostgreSQL vẫn được bảo toàn nguyên vẹn.

---

## 🎨 CHỦ ĐỀ 3: FRONTEND APP SHELL & CÁC LỖI BIÊN DỊCH

### 1. Cơ chế hoạt động của App Shell
App Shell là mô hình tải trước phần khung giao diện của ứng dụng (Thanh Menu, Header) và chỉ thay đổi phần ruột (Component trang) khi người dùng thao tác.
*   **State điều hướng:**
    ```tsx
    const [activeTab, setActiveTab] = useState(0);
    ```
    Trạng thái `activeTab` lưu chỉ số tab đang mở. Khi người dùng click nút trên Sidebar, hàm `setActiveTab(id)` được gọi -> React nhận biết sự thay đổi state -> Re-render và hiển thị Component tương ứng qua các dòng kiểm tra điều kiện:
    ```tsx
    {activeTab === 0 && <Tab0Dashboard />}
    ```

### 2. Bài học kinh nghiệm từ các lỗi biên dịch (TypeScript Errors)

#### Lỗi 1: `React is declared but its value is never read (TS6133)`
*   **Nguyên nhân:** Kể từ React phiên bản 17, trình biên dịch JSX tự động chuyển mã JSX mà không cần `import React from 'react'`. Trong khi đó cấu hình TypeScript khắt khe kiểm tra các thư viện được import mà không dùng đến (`noUnusedLocals`).
*   **Giải pháp:** Xóa dòng `import React from 'react';` ở các file không sử dụng trực tiếp đối tượng `React` (như gọi `React.useMemo`, `React.useState`). Chỉ giữ lại những gì cần dùng như `import { useState } from 'react';`.

#### Lỗi 2: `Type '"col"' is not assignable to type 'FlexDirection' (TS2322)`
*   **Nguyên nhân:** Trong CSS, thuộc tính hướng xếp chồng của hộp mềm (Flexbox) có các giá trị chuẩn là: `row`, `row-reverse`, `column`, `column-reverse`. Giá trị viết tắt `'col'` chỉ có trong các thư viện CSS Tailwind hoặc Bootstrap, không phải là giá trị hợp lệ của thuộc tính CSS chuẩn trong TypeScript.
*   **Giải pháp:** Đổi sang đúng thuộc tính `'column'`.

---

## 💻 CHỦ ĐỀ 4: SỬ DỤNG TRÌNH SOẠN THẢO VIM KHI MERGE GIT

### 1. Tại sao màn hình Vim hiện ra?
Khi bạn chạy lệnh `git merge`, Git cần tạo ra một **Commit Merge** để ghi nhận việc gộp hai nhánh. Nếu không truyền thông điệp commit (`-m`), Git sẽ tự động mở trình soạn thảo văn bản mặc định của hệ thống (thường là **Vim**) để bạn nhập hoặc xác nhận thông điệp.

### 2. Các phím tắt cơ bản để thao tác với Vim trong Terminal
*   **Lưu và Thoát (Lệnh phổ biến nhất):**
    1. Nhấn nút `Esc` trên bàn phím (để đảm bảo bạn đang ở chế độ lệnh - Command Mode).
    2. Gõ `:x` (hoặc `:wq`) và nhấn `Enter`.
*   **Thoát không lưu:**
    1. Nhấn nút `Esc`.
    2. Gõ `:q!` và nhấn `Enter`.
*   **Chế độ gõ văn bản (Insert Mode):**
    *   Nhấn phím `i` nếu bạn muốn sửa thông điệp merge commit trước khi lưu.

---

## 📂 CHỦ ĐỀ 5: QUẢN LÝ FILE TRONG GIT (.gitignore & các file JSON)

### 1. Có cần push các file JSON không?
*   **Có, rất cần thiết!**
*   Các file cấu hình dạng JSON như `package.json`, `package-lock.json`, `tsconfig.json`, `nest-cli.json` chứa thông tin sống còn của dự án:
    *   `package.json`: Khai báo các gói thư viện phụ thuộc và các câu lệnh chạy dự án.
    *   `package-lock.json`: Lưu vết chính xác tuyệt đối phiên bản (version) của từng thư viện được cài đặt. Điều này giúp các máy tính khác khi chạy `npm install` sẽ tải về phiên bản y hệt máy bạn, tránh lỗi lệch phiên bản.
    *   `tsconfig.json`: Quy chuẩn cấu hình biên dịch TypeScript.

### 2. Các file cần ẩn (Ignore) khi push lên GitHub
Chúng ta không đưa tất cả các file trong thư mục lên GitHub, một số file cần được bỏ qua thông qua file ẩn cấu hình `.gitignore` ở thư mục gốc:
*   `node_modules/`: Thư mục chứa thư viện đã tải về (rất nặng, hàng trăm MB). Thư mục này sẽ được tự tạo lại khi chạy lệnh `npm install`.
*   Thư mục build đầu ra: Như `dist/`, `build/` (đây là code đã được nén/dịch, không cần lưu trữ lịch sử Git).
*   Các file môi trường chứa mã bảo mật: `.env`, `.env.local` (chứa mật khẩu database, khóa bí mật JWT, API keys...). Nếu đẩy các file này lên GitHub sẽ rất dễ bị lộ thông tin bảo mật của hệ thống.
*   Các file rác của hệ điều hành: `.DS_Store` (macOS), `Thumbs.db` (Windows).

---

## 🚀 CHỦ ĐỀ 6: KIẾN TRÚC HỆ THỐNG LIVEORDER & PHÂN CHIA PHẠM VI CHO KỲ (DEV 2)

### 1. Luồng xử lý nghiệp vụ kép (Dual-Pipeline Architecture)
*   **Luồng 1 - Chốt đơn Nhanh (< 1ms):**
    Comment từ Livestream -> Thuật toán Aho-Corasick bóc tách SKU & Regex bóc SĐT -> Trừ kho Postgres Nguyên tử (Atomic Update) -> Bắn Socket.io nổ đơn lên Live Studio của Seller -> Gọi API gửi tin nhắn VietQR cho Buyer.
*   **Luồng 2 - Tư vấn AI (Groq SDK Llama 3):**
    Comment không có SKU -> Chuyển qua Module AI -> Đọc Knowledge Base (KbEntry) + Teencode -> Trả lời câu hỏi trực tiếp trên Khung Chat.

### 2. Phân chia phạm vi Codebase dành riêng cho Kỳ (Dev 2)
Theo quy tắc chống Git Conflict trong `AGENTS.md`:
*   **Backend NestJS (`apps/backend/src/`):**
    *   `modules/product/`: Quản lý CRUD Sản phẩm, SKU, Tồn kho.
    *   `core/aho-corasick/` & `modules/parser/`: Thuật toán Aho-Corasick & Regex bóc SKU + SĐT.
    *   `modules/order/`: Xử lý tạo đơn hàng & trừ kho Postgres nguyên tử.
    *   `modules/livestream/`: WebSocket Gateway Socket.io & quản lý phiên Live.
*   **Frontend React (`apps/frontend/src/`):**
    *   `pages/seller/`: Dashboard Quản lý sản phẩm (`/seller/dashboard`) & Live Studio WebCam (`/seller/live-studio`).
    *   `components/product/`: UI Components cho Sản phẩm & Kho.
    *   `components/stream/`: UI Components cho WebCam, Khung chat Live & Màn hình Nổ đơn.

---

## 📦 CHỦ ĐỀ 7: CHUYÊN SÂU BACKEND MODULE PRODUCT (NESTJS + PRISMA)

### 1. Ý nghĩa kiến trúc NestJS Module
*   **Controller (`product.controller.ts`)**: Nơi định nghĩa các router HTTP Endpoints (`@Post()`, `@Get()`, `@Patch()`, `@Delete()`). Controller đóng vai trò nhận dữ liệu yêu cầu từ Client (HTTP Body, Query Params, URL Params), gọi Service xử lý nghiệp vụ và trả về dữ liệu JSON cho Client.
*   **Service (`product.service.ts`)**: Nơi thực hiện toàn bộ logic nghiệp vụ (Business Logic). Tương tác trực tiếp với Database thông qua `PrismaService`.
*   **Module (`product.module.ts`)**: Gói đóng đóng gói Controller và Service lại với nhau. Đăng ký export `ProductService` để các Module khác (như `OrderModule`) có thể tái sử dụng.
*   **DTO (`create-product.dto.ts`, `update-product.dto.ts`)**: Data Transfer Object - Đối tượng định nghĩa cấu trúc dữ liệu truyền giữa Client và Server.

### 2. Xử lý nghiệp vụ quan trọng trong `ProductService`
*   **Kiểm tra tính duy nhất của Mã SKU (`where: { sku }`)**:
    ```typescript
    const existing = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
    if (existing) throw new BadRequestException(`Mã SKU '${dto.sku}' đã tồn tại!`);
    ```
    Giúp ngăn chặn tạo hai sản phẩm trùng mã SKU, là điều kiện tiên quyết để thuật toán Aho-Corasick bóc tách SKU chính xác ở các bước sau.
*   **Tương tác Prisma ORM linh hoạt**:
    *   `this.prisma.product.create({ data: dto })`: Thêm dòng sản phẩm mới vào bảng `Product`.
    *   `this.prisma.product.findMany({ where: { sellerId }, orderBy: { createdAt: 'desc' } })`: Lấy danh sách sản phẩm thuộc về Seller chỉ định, sắp xếp mới nhất lên đầu.
    *   `this.prisma.product.update({ where: { id }, data: dto })`: Cập nhật thông tin / Tồn kho sản phẩm theo ID.
    *   `this.prisma.product.delete({ where: { id } })`: Xóa sản phẩm khỏi database.




