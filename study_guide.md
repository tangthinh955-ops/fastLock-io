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
