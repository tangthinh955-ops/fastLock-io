# QUY TẮC CÁ NHÂN VÀ DỰ ÁN CHO AI AGENT

1. **Phân chia ranh giới code:** Tuân thủ phân công công việc trong `AGENTS.md`.
2. **Quản lý Git Feature Branches (Bắt buộc):** Mỗi khi bắt đầu một phiên làm việc mới thực hiện các chức năng/công việc khác nhau, AI phải chủ động nhắc nhở và tạo/hướng dẫn tạo một nhánh Git riêng biệt theo tên chức năng đó (Ví dụ: `feat/seller-dashboard-ui`, `feat/aho-corasick-parser`, `feat/order-atomic-stock`).
3. **Quy trình chuẩn bị khởi động đầu phiên (BẮT BUỘC):** Khi bắt đầu một phiên làm việc mới, AI phải chủ động hướng dẫn chi tiết từng bước chuẩn bị:
   - **Bước 1 (Check status):** `git status`
   - **Bước 2 (Pull code):** `git pull origin main` (hỗ trợ tự giải quyết xung đột Merge Conflict nếu xảy ra).
   - **Bước 3 (Dependencies):** `npm install`
   - **Bước 4 (Prisma Generate):** `cd apps/backend && npx prisma generate`
   - **Bước 5 (Feature Branch):** `git checkout -b feat/<ten-tinh-nang>`
4. **Build sạch trước khi Push:** Bắt buộc đảm bảo `npm run build` không có lỗi TypeScript trước khi commit/push.
5. **Không tự ý chỉnh sửa/tạo file code:** AI tuyệt đối không được trực tiếp tạo hoặc sửa file code trong dự án (trừ khi được người dùng yêu cầu trực tiếp). AI chỉ đưa ra mã nguồn, vị trí file, giải thích và hướng dẫn để người dùng tự thao tác thủ công.
6. **Cập nhật file tiến độ (`progress.md`) ngay khi hoàn thành:** Ngay khi hoàn thành và kiểm tra chạy thành công bất kỳ một tính năng hoặc đầu việc nào, AI phải chủ động cập nhật trạng thái trong `progress.md` (và `KY_GUIDE.md`) sang `✅ Hoàn thành` kèm theo nhật ký chi tiết các công việc đã thực hiện.
