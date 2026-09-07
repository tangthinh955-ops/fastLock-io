# TIẾN ĐỘ DỰ ÁN: LIVEORDER CHỐT ĐƠN ENGINE

---

## 📌 THÔNG TIN HỆ THỐNG & PHÂN CHIA VAI TRÒ
* **Repository:** `fastLock-io`
* **Nhánh Git hiện tại:** `Ky`
* **Vai trò:** **Kỳ (Dev 2)** - Phụ trách Luồng Sản phẩm, Thuật toán Aho-Corasick/Parser, Trừ kho Order, Socket Livestream & Live Studio WebCam UI.
* **📖 HƯỚNG DẪN RIÊNG CHO KỲ:** Chi tiết sơ đồ lộ trình, giải thích code, lệnh test ngay & quy trình Git xem tại [`KY_GUIDE.md`](file:///d:/project/Th%C6%B0%20mu%CC%A3c%20m%C6%A1%CC%81i/fastLock-io/KY_GUIDE.md).

---

## 📊 BẢNG TỔNG HỢP TIẾN ĐỘ DỰ ÁN

| Giai đoạn | Tính năng / Công việc | Người phụ trách | Trạng thái |
| :--- | :--- | :---: | :---: |
| **Phase 0** | Khởi tạo Monorepo & Docker (Postgres, Redis) | Cả hai | ✅ Hoàn thành |
| **Phase 0** | Scaffold Cấu trúc thư mục theo `AGENTS.md` | Dev 1 | ✅ Hoàn thành |
| **Phase 0** | Prisma Schema & Seed (User, Product, Order, Livestream...) | Dev 1 | ✅ Hoàn thành |
| **Phase 0** | App Router (`App.tsx`) & Layout cơ bản | Dev 1 | ✅ Hoàn thành |
| **Phase 1** | **Backend Module Product (CRUD & Stock)** | **Dev 2 (Kỳ)** | ✅ Hoàn thành |
| **Phase 1** | **Frontend UI `/seller/dashboard` (Quản lý sản phẩm)** | **Dev 2 (Kỳ)** | ✅ Hoàn thành |
| **Phase 1** | Thuật toán Aho-Corasick Parser & Order Atomic Stock | Dev 2 (Kỳ) | ⏳ Chưa bắt đầu |
| **Phase 1** | Module Livestream Socket Gateway & Live Studio UI | Dev 2 (Kỳ) | ⏳ Chưa bắt đầu |
| **Phase 1** | Direct Message hai chiều & VietQR API | Dev 1 | ✅ Hoàn thành |
| **Phase 1** | Module AI (Groq SDK), KbEntry & tư vấn riêng trong Inbox | Dev 1 | ✅ Hoàn thành |
| **Phase 1** | Viewer Live UI, Buyer Inbox & Seller Inbox | Dev 1 | ✅ Hoàn thành |
| **Phase 2** | Tích hợp Socket & AI (Full Pipeline E2E) | Cả hai | ⏳ Chưa bắt đầu |

*Ký hiệu: ⏳ Chưa bắt đầu | 🔄 Đang thực hiện | ✅ Hoàn thành | ❌ Lỗi*

---

## 📝 NHẬT KÝ DEV 1 (THỊNH)

### 📌 DIRECT MESSAGE, AI & INBOX

1. **Backend Direct Message:** ✅ **Hoàn thành**
   - Buyer lấy danh sách shop và lịch sử hội thoại hai chiều theo từng Seller.
   - Buyer gửi câu hỏi riêng; tin Buyer và phản hồi từ Groq AI đều được lưu vào bảng `DirectMessage`.
   - Seller lấy danh sách Buyer đã từng trao đổi, xem lịch sử và gửi trả lời thủ công.
   - API được giới hạn theo role `BUYER`/`SELLER`; danh tính người gửi lấy từ JWT.
   - Lịch sử hỗ trợ phân trang bằng `limit` và `skip`, mặc định tải 5 tin mới nhất.

2. **Frontend Inbox:** ✅ **Hoàn thành**
   - `/inbox`: Buyer chọn shop, đọc lịch sử, gửi câu hỏi, nhận phản hồi AI và xem VietQR.
   - `/seller/inbox`: Seller chọn khách hàng, kiểm tra lịch sử AI và trả lời thủ công.
   - Hai màn hình tải thêm từng 5 tin cũ, giữ vị trí đang đọc và báo khi đến đầu cuộc trò chuyện.
   - Viewer có nút **Tư vấn riêng với Shop**, truyền `sellerId` để Inbox mở đúng hội thoại.

3. **Viewer Livestream:** 🔄 **Chờ tích hợp Dev 2**
   - Đã tách AI khỏi khung bình luận livestream; AI chỉ tư vấn trong Inbox riêng.
   - Bình luận Viewer hiện là mô phỏng phía frontend.
   - Đồng bộ bình luận realtime bằng Socket.io phụ thuộc module `livestream` của Dev 2.

4. **Giới hạn hiện tại:**
   - Bảng `DirectMessage` chưa có trường phân biệt phản hồi do AI tạo với phản hồi Seller tự nhập.
   - Inbox chưa cập nhật realtime; người nhận cần tải lại hội thoại để thấy tin thủ công mới.

---

## 📝 NHẬT KÝ VÀ KẾ HOẠCH CHI TIẾT CHO KỲ (DEV 2)

### 📌 PHASE 1 - NHIỆM VỤ 1 (PRODUCT & SELLER DASHBOARD)
1. **Backend NestJS (`apps/backend/src/modules/product/`):** ✅ **Hoàn thành**
   - Đã tạo `PrismaService` & `PrismaModule`.
   - Đã viết DTOs: `CreateProductDto`, `UpdateProductDto`.
   - Đã tạo `ProductService`, `ProductController`, `ProductModule` và đăng ký vào `AppModule`.
   - Đã kiểm tra build: `npm run build:backend` thành công 100%.

2. **Frontend React (`apps/frontend/src/`):** 🔄 **Đang thực hiện**
   - Tạo trang `/seller/dashboard` tại `apps/frontend/src/pages/seller/SellerDashboard.tsx`.
   - Tạo các component sản phẩm tại `apps/frontend/src/components/product/ProductList.tsx` và `ProductModal.tsx`.
   - Tích hợp gọi API Backend CRUD sản phẩm.

