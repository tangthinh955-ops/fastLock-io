# TIẾN ĐỘ DỰ ÁN: LIVEORDER CHỐT ĐƠN ENGINE

## Cập nhật 14/10/2026 — S06 bước C1: Đồng bộ chế độ hội thoại (Dev 1)

- ✅ Hoàn thành code và kiểm tra tự động C1 trên `feat/inbox-realtime-socket`. Thêm sự kiện `conversation_mode_changed` chứa buyerId/sellerId/mode/version, chỉ phát tới room riêng của hai người sau khi lưu chế độ thành công. Seller gửi thủ công: mode HUMAN và tin SELLER lưu cùng transaction; chỉ phát mode và tin sau commit, giữ response HTTP cũ.
- Frontend dùng Socket hiện có, lọc danh tính/mode/version và tháo listener khi cleanup. Hook Buyer/Seller chỉ áp dụng trạng thái cho đúng hội thoại đang chọn; khi inbox_ready lần đầu, đọc lại mode để giảm khoảng trống lúc kết nối.
- `useConversationMode` giữ trạng thái khi refresh, so sánh version để không nhận trạng thái cũ từ HTTP/Socket; callback của hội thoại cũ không được refresh hoặc áp dụng vào hội thoại mới. Giữ cơ chế backend loại phản hồi AI đang chờ khi mode/version thay đổi.
- File MODIFY: backend `direct-message.events.ts`, `direct-message.service.ts`, `direct-message.service.spec.ts`, `direct-message.gateway.spec.ts`; frontend `components/inbox/types.ts`, `hooks/useInboxSocket.ts`, `hooks/useConversationMode.ts`, `hooks/useBuyerInbox.ts`, `hooks/useSellerInbox.ts`; tài liệu `progress.md`. Không tạo file mới, không đổi schema/dependency hoặc sửa module Dev2/[CHUNG]. Giữ nguyên staging và nội dung tài liệu RAG của người dùng; không commit/push.
- Kiểm tra: build Backend và Frontend thành công; 2 bộ test Gateway/Service, 41 ca pass. Kiểm tra hook bằng Node/TypeScript với React/API/Socket giả lập: HTTP đến muộn, sự kiện version cũ, giữ version khi refresh, callback hội thoại cũ, lọc sự kiện và cleanup đều pass. Không tạo file test tạm trong repository. Vite còn cảnh báo bundle >500 kB.
- Chưa nghiệm thu C1 trên trình duyệt/Groq thật. Test thủ công: hai phiên Buyer/Seller mở cùng hội thoại -> Seller Tiếp quản/Bật lại AI -> Header Buyer đổi ngay không reload; gửi Seller thủ công -> HUMAN; đổi khách -> không cập nhật nhầm khách; Buyer hỏi trong HUMAN -> không có tin AI. Đây là cập nhật trạng thái trong Inbox, chưa thêm toast/thông báo ngoài trang.
- Còn lại S06: đồng bộ đã đọc/badge và tải bù tin/trạng thái khi reconnect; chưa triển khai trong C1. RAG S19 tiếp tục để sau.

---

## Cập nhật 14/10/2026 — Bổ sung S19 vào bảng phiên chính

- ✅ Hoàn thành cập nhật tài liệu: thêm S19 RAG vào bảng phiên làm việc trong plan.md và đổi số phiên từ 18 thành 19; giữ mục 7 đã có, không tạo mục chi tiết trùng.
- Phạm vi giữ nguyên: Dev 1, 7 ngày gồm RAG và báo cáo/demo. Chưa triển khai RAG, không sửa code hoặc schema.

## Cập nhật 12/10/2026 — Bổ sung S19 vào plan.md

- ✅ Hoàn thành cập nhật tài liệu theo nội dung người dùng đã duyệt: S19 do Dev 1 thực hiện trong 7 ngày, gồm RAG trên KbEntry, đánh giá và báo cáo/demo.
- Giữ keyword/answer/sellerId, lọc đúng Shop trước retrieval, tận dụng S05 và S06 A/B; không thêm PDF, database vector hoặc UI mới trong phạm vi này.
- Lịch một tuần trong plan.md thay cho lịch bốn tuần của kế hoạch tham khảo trước đó. RAG vẫn chưa triển khai; không sửa code/schema hoặc cài dependency.

## Cập nhật 12/10/2026 — Lưu kế hoạch RAG để triển khai sau

- ✅ Hoàn thành tài liệu `RAG_UPGRADE_PLAN.md` theo yêu cầu người dùng.
- Kế hoạch giữ `keyword`/`answer`, phân biệt kiến thức bằng `sellerId`, đề xuất embedding và truy xuất trên KbEntry, lộ trình bốn tuần, file tác động và điều kiện nghiệm thu.
- Chỉ lập tài liệu; chưa triển khai RAG, chưa sửa code/schema/dependency. Quyết định kiến trúc và thay đổi [CHUNG] cần duyệt khi bắt đầu.
- Đã kiểm tra nội dung kế hoạch và lỗi khoảng trắng; không chạy build/test cho thay đổi tài liệu. Không tìm thấy `KY_GUIDE.md` trong dự án nên không tạo file hướng dẫn mới cho Dev 2 chỉ để ghi nhật ký.

---

## Cập nhật 10/10/2026 — S06 bước B: Frontend nhận tin và xếp hội thoại mới nhất (Dev 1)

- ✅ Hoàn thành phần code và kiểm tra tự động bước B trên nhánh `feat/inbox-realtime-socket`; giữ nguyên staging của bước A, không tự commit/push.
- Thêm `useInboxSocket`: kết nối namespace `/inbox` với JWT từ AuthContext, dùng địa chỉ Backend từ apiClient; nhận new_message, kiểm tra đúng người gửi/nhận, chống sự kiện trùng ID. Callback cập nhật qua ref nên đổi hội thoại/render không mở lại Socket. Rời trang, logout hoặc đổi token sẽ tháo listener và ngắt kết nối; lỗi Socket hiện trong vùng lỗi Inbox, HTTP vẫn dùng được.
- Buyer/Seller hook đưa đúng hội thoại có tin mới lên đầu, giữ nguyên lựa chọn hiện tại và chỉ thêm bong bóng nếu tin thuộc hội thoại đang mở. Seller nhận khách mới sẽ tải lại danh sách, giữ lựa chọn; payload incoming có tên Buyer giúp hiện khách mới ngay. Phản hồi HTTP cũng cập nhật hoạt động, nhưng không đẩy một hoạt động cũ lên trên tin mới hơn.
- `inboxMessages.ts` gộp tin theo ID và sắp từ cũ đến mới. `usePaginatedConversation` gắn dữ liệu với hội thoại, gộp GET/Socket/HTTP thay vì ghi đè, bỏ kết quả phân trang muộn của hội thoại cũ, ngăn tải thêm đồng thời và giữ vị trí cuộn khi thêm tin cũ. Tin mới không kéo người đang đọc lịch sử xuống cuối.
- Khi nhận inbox_ready lần đầu, tải lại danh sách và gộp 5 tin gần nhất của hội thoại hiện tại để giảm khoảng trống lúc mở Inbox/kết nối Socket. Chưa có tải bù đầy đủ khi reconnect; chức năng đó thuộc bước C.
- Backend getShops/getSellerCustomers lấy thời gian mới nhất của cả hai chiều trong đúng cặp, xếp mới nhất trước; Shop chưa trao đổi nằm sau, thời gian bằng nhau dùng tên/id ổn định. Giữ response id/name/unreadCount, không đổi schema/migration hoặc API URL, không sửa module Dev2 hay thêm dependency.
- Kiểm tra: 39 test Gateway/Service thành công; build Backend và Frontend thành công, Vite còn cảnh báo bundle >500 kB. Dùng npm.cmd vì PowerShell chặn npm.ps1, không đổi ExecutionPolicy. git diff --check không lỗi.
- Kiểm tra hàm Frontend bằng Node/TypeScript: gộp tin Socket với lịch sử trả muộn, trùng HTTP/Socket, chồng trang và thứ tự tin; activity cũ không vượt activity mới. Kiểm tra Service với PostgreSQL thật: tin hai chiều quyết định thứ tự, hoạt động Buyer khác không ảnh hưởng danh sách Shop của Buyer hiện tại, Shop chưa chat đứng sau và response giữ cấu trúc cũ. Dữ liệu test tạm và script ngoài repo đã dọn, 11 tin có sẵn giữ nguyên.
- Chưa nghiệm thu qua trình duyệt: Backend/Frontend chưa chạy tại 3001/5173 lúc kiểm tra. Test thủ công: mở hai phiên Buyer/Seller -> gửi hai chiều -> nhận AI và QR không reload, không nhân đôi tin -> khách khác nhắn thì lên đầu Sidebar nhưng không tự đổi người đang chọn -> reload vẫn xếp mới nhất trước -> tải tin cũ/đổi hội thoại khi có tin mới -> đóng/mở Inbox nhiều lần.
- Bước C chưa làm: đồng bộ mode AI/HUMAN, trạng thái đã đọc/badge giữa các phiên và tải bù tin bỏ lỡ khi reconnect. Chưa thêm toast/thông báo ngoài Inbox. Các dòng giới hạn cũ bên dưới mô tả trạng thái trước bước B; người nhận đã có listener realtime khi đang mở Inbox, nhưng cần nghiệm thu giao diện thực tế.

---

## Cập nhật S06 bước A — Backend Socket Inbox riêng (Dev 1)

- ✅ Hoàn thành phần Backend bước A trên nhánh `feat/inbox-realtime-socket`. Thêm DirectMessageGateway trong namespace `/inbox`, DirectMessageEvents để phát tin và bộ test Gateway/Events. DirectMessageModule dùng JwtService từ AuthModule hiện có; không sửa Auth, AppModule, schema/migration, Frontend hoặc module Dev2, không thêm dependency.
- Kết nối dùng `handshake.auth.token`: kiểm tra chữ ký/hạn JWT, sub, tài khoản tồn tại và role trong DB khớp token, chỉ BUYER/SELLER. Namespace middleware từ chối trước khi kết nối thành công. Gateway tự join `user:<id>` từ JWT, không nhận room hoặc danh tính từ payload client; phát `inbox_ready` sau khi join xong.
- Service phát `new_message` sau khi lưu/commit thành công, chỉ tới room người gửi và người nhận; payload có id, senderId, receiverId, source, content, qrUrl, createdAt và sender id/name/role, không có email/password. BUYER phát trước khi gọi Groq; AI chỉ phát sau transaction mode/version thành công; SELLER sau transaction tiếp quản; SYSTEM sau lưu VietQR. Response HTTP VietQR giữ cấu trúc cũ, thông tin sender chỉ thêm trong sự kiện.
- DirectMessageEvents tách khỏi Service/Gateway để tránh phụ thuộc vòng; lỗi phát Socket được ghi log và không làm API gửi tin/luồng VietQR thất bại. Offline không nhận sự kiện đã bỏ lỡ; database vẫn là nguồn lịch sử, tải bù sẽ làm ở các bước sau. Chưa có outbox/retry hoặc bảo đảm phát sự kiện khi process dừng giữa commit và emit.
- Kiểm tra: `npm run build:backend` thành công; 2 bộ test Gateway/Service, 37 ca thành công, kiểm tra JWT/role/room, thời điểm phát Buyer/AI, transaction thất bại và sự kiện QR. Khi chạy cả nhóm `direct-message`, 1 test Controller có sẵn lỗi vì thiếu provider/mock DirectMessageService; file này không thay đổi, chưa sửa ngoài kế hoạch. Không tuyên bố toàn bộ test dự án đã xanh.
- Kiểm thử thật với Nest AppModule, HTTP/JWT/PostgreSQL và Socket.io client: token sai/hết hạn, user không tồn tại/role lệch bị chặn; room giả từ client không được dùng; BUYER/AI/SELLER/SYSTEM tới đúng hai phía, không rò tin cho tài khoản thứ ba, không phát trùng trong kịch bản kiểm tra; tin Buyer tới trước khi Groq giả lập trả lời và AI đã bị Seller tiếp quản không được lưu/phát. Dữ liệu tạm và script kiểm thử ngoài repo đã dọn, 11 tin có sẵn giữ nguyên.
- Công cụ sandbox Windows bị lỗi khởi tạo; đọc file/chạy kiểm tra qua lệnh ngoài sandbox đã được người dùng cho phép. Không tự commit/push hoặc tạo nhánh.
- Chưa hoàn thành S06 toàn bộ: bước B nối listener Frontend và chống trùng HTTP/Socket theo message.id; bước C đồng bộ chế độ AI/HUMAN, đã đọc và tải bù khi reconnect. UI hiện vẫn cần reload; không thêm toast/thông báo ngoài Inbox trong bước A.

---

## Cập nhật 08/10/2026 — S05 bước B: Nút tiếp quản và bật lại AI (Dev 1)

- ✅ Hoàn thành phần code và kiểm tra tự động bước B trên nhánh `feat/inbox-ai-consult-flow`. Không sửa schema/migration hoặc module Dev2; không thêm dependency, không tự commit/push.
- Thêm GET `/messages/conversations/:sellerId/mode` cho Buyer, GET/PATCH `/messages/seller/conversations/:buyerId/mode` cho Seller. Danh tính từ JWT; Seller phải có lịch sử với đúng Buyer trong Shop mình. DTO chỉ nhận AI/HUMAN, dùng ValidationPipe hiện có.
- GET trả mode/version; cặp chưa có bản ghi trả AI/version 0 mà không tạo dữ liệu. PATCH upsert đúng cặp và tăng version khi cập nhật để phản hồi AI cũ bị loại, kể cả khi đã tắt rồi bật lại AI. Đổi chế độ không tạo tin nhắn hoặc gọi Groq, không trả lời lại câu hỏi cũ.
- SellerInbox có nút Tiếp quản/Bật lại AI bên phải ChatHeader, hiện AI đang hỗ trợ/Shop trực tiếp hỗ trợ. Nút khóa khi chưa tải được chế độ hoặc đang gửi/đổi; lỗi PATCH giữ chế độ cũ và báo lỗi. Seller gửi thủ công vẫn tự chuyển HUMAN và tải lại chế độ.
- BuyerInbox chỉ hiển thị chế độ, tải lúc chọn Shop và sau khi gửi. `useConversationMode` dùng chung cho việc đọc trạng thái, tách khỏi logic quyền đổi chế độ; state gắn endpoint, phản hồi request cũ bị bỏ khi chuyển hội thoại/unmount. Header nhận actions qua props, không tự gọi API.
- Kiểm tra: 22 ca unit test DirectMessage thành công; Nest build, frontend tsc -b và Vite build thành công qua CLI Node trực tiếp. Vite còn cảnh báo bundle >500 kB; git diff --check không lỗi.
- Kiểm thử HTTP với Nest AppModule/JWT/PostgreSQL thật, Groq giả lập: thiếu token 401, Buyer PATCH 403, Seller khác Shop 404, mode sai/trường thừa 400; AI/HUMAN, bật lại chỉ trả lời câu mới, tăng version loại phản hồi đang chờ sau tắt/bật, cách ly khách khác đều thành công. Dữ liệu test tạm đã dọn; 7 tin có sẵn giữ nguyên.
- Chưa nghiệm thu giao diện qua trình duyệt/Groq thật. Kịch bản: Buyer hỏi -> AI trả lời -> Seller Tiếp quản -> Buyer hỏi AI im lặng -> Seller Bật lại AI -> Buyer hỏi mới AI trả lời; thử gửi Seller thủ công, reload và đổi khách. Phía bên kia phải tải lại để cập nhật chế độ/tin vì realtime thuộc S06, chưa triển khai trong bước B.

---

## Cập nhật 07/10/2026 — S05 bước A: Seller tự tiếp quản Inbox (Dev 1)

- ✅ Hoàn thành phần code bước A trên nhánh `feat/inbox-ai-consult-flow`: thêm `ChatMode` AI/HUMAN và bảng `Conversation` duy nhất theo cặp Buyer–Seller. Migration `20261007010000_add_conversation` đã áp dụng; migrate status báo up to date. Không xóa tin cũ, không thêm conversationId vào DirectMessage.
- Seller gửi trả lời thủ công: chuyển đúng hội thoại sang HUMAN, tăng version và lưu tin SELLER trong cùng transaction. Nếu lưu tin thất bại, thay đổi chế độ cũng rollback.
- Buyer gửi tin trong HUMAN: lưu BUYER, không đọc lịch sử AI hoặc gọi Groq, trả `aiMessage: null`. Trong AI: giữ ngữ cảnh cũ; sau khi Groq trả lời, UPDATE có điều kiện mode/version và CREATE tin AI nằm cùng transaction để loại phản hồi đang chờ khi Seller đã tiếp quản. Không giữ transaction trong lúc gọi Groq.
- Frontend cho phép aiMessage null và chỉ thêm tin AI khi có dữ liệu. Header Buyer đổi thành “Trao đổi riêng với Shop”, không khẳng định AI luôn sẵn sàng. Không thay đổi Controller, module Dev2 hoặc thêm dependency.
- Kiểm tra: 10 ca unit test DirectMessage thành công; Nest build, frontend `tsc -b` và Vite build thành công qua CLI Node trực tiếp; git diff --check không lỗi. Vite còn cảnh báo bundle >500 kB.
- Kiểm tra PostgreSQL thật với Service và AI giả lập: AI mặc định, rollback khi lưu tin Seller lỗi, bỏ phản hồi AI đang chờ sau tiếp quản, giữ HUMAN khi Buyer gửi tiếp và cách ly khách khác đều thành công. Dữ liệu test tạm đã dọn; 3 tin có sẵn giữ nguyên, User/Product/Order lần lượt vẫn 5/2/10 sau khi dọn.
- ✅ Hoàn thành bước chuẩn bị môi trường ngày 08/10/2026: sau khi người dùng dừng Backend, `prisma generate` thành công (Client v6.19.3), migrate status báo cả 3 migration đã áp dụng và Nest build lại thành công. Không reset database hoặc chạy lại migration xóa tin cũ. Chưa nghiệm thu qua trình duyệt/Groq thật.
- Tại thời điểm hoàn thành bước A, bước B chưa triển khai; đã bổ sung nút Tiếp quản/Bật lại AI trong cập nhật 08/10/2026 phía trên. Inbox realtime thuộc S06; người nhận vẫn cần tải lại hội thoại.

---

## Cập nhật 07/10/2026 — Hiển thị nguồn tin Inbox (Dev 1)

- ✅ Hoàn thành phần frontend: `components/inbox/types.ts` có kiểu MessageSource và trường source bắt buộc trong DirectMessage.
- `MessageBubble.tsx` dùng source để hiện Bạn/tên khách (BUYER), tên Shop · Nhân viên Shop (SELLER), tên Shop · Trợ lý AI (AI), tên Shop · Hệ thống (SYSTEM), áp dụng cho cả Buyer/Seller Inbox. Dữ liệu thiếu source dùng tên người gửi, không đoán AI.
- Nhãn suy ra từ dữ liệu; giữ cách căn hai phía bằng senderId và hiển thị VietQR. Không thêm state/component/hook mới hoặc thay đổi backend/schema.
- Kiểm tra: TypeScript `tsc -b` và `vite build` đều thành công, chạy trực tiếp qua Node vì công cụ terminal không khởi tạo được và npm script chưa chạy được trọn vẹn. Vite còn cảnh báo bundle >500 kB. Chưa kiểm tra giao diện trên trình duyệt.
- Test thủ công: Buyer hỏi → thấy Bạn và Trợ lý AI; Seller trả lời → thấy Nhân viên Shop; tạo đơn mới có QR → thấy Hệ thống. Kiểm tra cả hai màn hình; tải lại hội thoại để thấy tin của phía còn lại vì Inbox realtime chưa triển khai.

---

## Cập nhật 07/10/2026 — Phân loại nguồn tin Inbox (Đợt 1, Dev 1)

- ✅ Hoàn thành backend phân loại nguồn tin: baseline `0_init` và migration `20261007000000_add_message_source` đã áp dụng trên database local. Kiểm tra cấu trúc trước baseline không có khác biệt; baseline chỉ được đánh dấu đã áp dụng, không chạy lại CREATE TABLE trên database đang có.
- Theo yêu cầu của chủ dự án, migration xóa 122 tin thử nghiệm trong `DirectMessage`, thêm `source` bắt buộc với BUYER/SELLER/AI/SYSTEM, không có mặc định hoặc UNKNOWN. DELETE và ALTER nằm trong một transaction có khóa bảng.
- Kiểm tra sau migration: DirectMessage = 0; User = 5, Product = 2, KbEntry = 4, Livestream = 17, Order = 10, OrderItem = 10, số lượng giữ nguyên so với trước. Cột source NOT NULL và không có default; Prisma migrate status báo up to date.
- Service gán BUYER khi khách gửi, AI khi Groq trả lời, SELLER khi Seller nhập và SYSTEM cho tin VietQR. Lịch sử gửi AI loại SYSTEM và các tin có QR. Chưa thêm nhãn giao diện hoặc realtime/takeover.
- Cập nhật các assertion unit test hiện có: 5 ca DirectMessage thành công với Prisma/Groq giả lập; diff check không lỗi. Lần đầu generate bị Windows khóa query engine; chạy lại `prisma generate` đã thành công (Client v6.19.3). Kiểm tra import runtime có đủ BUYER/SELLER/AI/SYSTEM; backend build sau generate thành công; migrate status báo up to date. Chưa test end-to-end qua giao diện.
- Lưu ý phối hợp: database mới chạy `prisma migrate deploy` để dựng cả baseline và cột source. Database đã có cấu trúc cũ phải kiểm tra khớp baseline rồi `prisma migrate resolve --applied 0_init` trước deploy; migration nguồn tin sẽ xóa Inbox cũ trên database đó. Không reset database, không dùng trên dữ liệu cần giữ; Dev2 dùng chung database đã cập nhật chỉ cần generate sau khi kéo code.

---

## Cập nhật 07/10/2026 — Kế hoạch chuyển khoản thật

- ✅ Hoàn thành cập nhật tài liệu: `plan.md` v2.1 chuyển S07/S08 sang QR + webhook xác nhận giao dịch thật + thông báo SYSTEM vào Inbox.
- Dev2 lead Payment/Order, Dev1 lead DirectMessage/Inbox; schema/hợp đồng thanh toán cần thống nhất trước khi code. Phương án SePay đang nghiên cứu, chưa xác nhận ngân hàng/điều kiện/phí hoặc kết nối tài khoản thật.
- Bổ sung đối chiếu giao dịch, chống lặp, transaction/outbox, retry thông báo, đối soát và tình huống tiền vào sai số tiền/sai mã/sau hủy. Bắt đầu một Shop đã kết nối, rồi mở rộng.
- Thanh toán tự động và thông báo PAID chưa triển khai/chưa nghiệm thu; nhật ký 02/10 bên dưới mô tả kế hoạch cũ xác nhận thủ công, được thay thế bởi yêu cầu này. Không sửa code/schema, không thực hiện giao dịch tiền thật trong phiên cập nhật tài liệu.

---

## Cập nhật 02/10/2026 — Lập kế hoạch nâng cấp toàn dự án

- ✅ Hoàn thành đầu việc lập kế hoạch: đối chiếu trang giới thiệu TPos Livestream, `plan.md`, tiến độ và code hiện tại để viết lại phần ưu tiên trong `plan.md`; giữ kế hoạch ban đầu làm phụ lục đối chiếu.
- Kế hoạch mới chia mốc A–E: ổn định quyền/pipeline/chống lặp; vòng đời đơn/người nhận/QR; Inbox realtime và Seller tiếp quản; AI dùng dữ liệu có nguồn và đánh giá; phiên live/báo cáo/demo có bằng chứng.
- Phân công rõ Dev1/Dev2/[CHUNG], dependency schema/API/Socket, file và component dự kiến, tiêu chí nghiệm thu và kiến thức mỗi Dev phải trình bày được.
- Ghi rõ Viewer hiện dùng ảnh minh họa, AI lịch sử còn thiếu E2E Groq thật, payment/giao hàng dự kiến demo thủ công; không biến các hạn chế thành tính năng đã hoàn thành.
- Chỉ cập nhật tài liệu. Các mốc nâng cấp chưa triển khai; không chạy build/test mới cho thay đổi Markdown, không đổi schema/API/code hoặc trạng thái các chức năng bên dưới.
- Repository còn thay đổi staged/unstaged trên `feat/direct-history`; chuẩn bị pull/install/generate/nhánh tính năng sau khi công việc dở dang được người dùng xử lý. Chưa có deadline cụ thể; dùng mốc nghiệm thu thay cho lịch tuần cố định.

---

## 📌 THÔNG TIN HỆ THỐNG & PHÂN CHIA VAI TRÒ
* **Repository:** `fastLock-io`
* **Nhánh Git hiện tại:** `feat/inbox-realtime-socket`
* **Phân công:** Dev 1 phụ trách Auth/User/AI/Direct Message/Admin/Viewer/Inbox; Dev 2 phụ trách Product/Parser/Order/Livestream/Live Studio.
* **Quy tắc phối hợp:** Xem `AGENTS.md`; `KY_GUIDE.md` hiện không có trong repository.

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
| **Phase 1** | **Thuật toán Aho-Corasick (`core/aho-corasick`)** | **Dev 2 (Kỳ)** | ✅ Hoàn thành |
| **Phase 1** | **Module Parser SĐT & Comment (`modules/parser`)** | **Dev 2 (Kỳ)** | ✅ Hoàn thành |
| **Phase 1** | **Order Atomic Stock (`modules/order`)** | **Dev 2 (Kỳ)** | ✅ **Hoàn thành** |
| **Phase 1** | **Module Livestream Socket Gateway & Live Studio UI** | **Dev 2 (Kỳ)** | ✅ **Hoàn thành** |
| **Phase 1** | Direct Message hai chiều & VietQR API | Dev 1 | ✅ Hoàn thành |
| **Phase 1** | Module AI (Groq Qwen), KbEntry & tư vấn riêng trong Inbox | Dev 1 | ✅ Hoàn thành |
| **Phase 1** | Viewer Live UI, Buyer Inbox & Seller Inbox | Dev 1 | ✅ Hoàn thành |
| **Phase 2** | Tích hợp Livestream, Order, VietQR & Inbox (Full Pipeline E2E) | Cả hai | 🔄 Đang thực hiện |

*Ký hiệu: ⏳ Chưa bắt đầu | 🔄 Đang thực hiện | ✅ Hoàn thành | ❌ Lỗi*

---

## 📝 NHẬT KÝ DEV 1 (THỊNH)

### 📌 DIRECT MESSAGE, AI & INBOX

#### Cập nhật 27/09/2026 — Ngữ cảnh tư vấn AI

- ✅ Hoàn thành phần backend và kiểm tra tự động trên nhánh `feat/direct-history`.
- `DirectMessageService` đọc tối đa 10 tin cũ của đúng cặp Buyer–Seller, bỏ tin có VietQR, xếp từ cũ đến mới và gán vai trò Buyer/Shop. Đọc lịch sử trước khi lưu câu mới để câu hỏi hiện tại không bị gửi lặp.
- `AiService` gửi Knowledge Base + lịch sử + câu hỏi mới cho Groq. Phần lịch sử giới hạn 4.000 ký tự, ưu tiên các tin mới nhất và bỏ nguyên tin cũ khi vượt giới hạn; không xóa lịch sử trong database.
- Prompt dùng ngữ cảnh để hiểu câu hỏi nối tiếp, hỏi lại khi thiếu tên/SKU, chuyển theo sản phẩm mới và không coi câu trả lời cũ là nguồn thay thế Knowledge Base.
- Giữ nguyên API, schema, frontend, model và giới hạn phản hồi 200 token; không thay đổi module Dev 2.
- Kiểm tra: 2 bộ unit test, 11 ca thành công (Groq/Prisma giả lập); `npm run build:backend` thành công. Chưa kiểm thử end-to-end trên Inbox với Groq thật.
- Test thủ công tiếp theo: hỏi tên sản phẩm → chiều cao/cân nặng → “Vậy chọn size nào?”; đổi sản phẩm; đổi Shop/Buyer; thử hội thoại mới. Sản phẩm và bảng size phải có trong Knowledge Base để đánh giá câu trả lời.
- Giới hạn: 10 tin tương đương khoảng 5 lượt, không bảo đảm đủ 5 cặp khi khách/Seller gửi liên tiếp hoặc vượt 4.000 ký tự. Tin Seller thủ công và AI cùng mang vai trò phía Shop; ngân sách ký tự lịch sử không phải giới hạn token toàn request và không bảo đảm tránh mọi lỗi 429.

1. **Backend Direct Message:** ✅ **Hoàn thành**
   - Buyer lấy danh sách shop và lịch sử hội thoại hai chiều theo từng Seller.
   - Buyer gửi câu hỏi riêng; tin Buyer và phản hồi từ Groq AI đều được lưu vào bảng `DirectMessage`.
   - Seller lấy danh sách Buyer đã từng trao đổi, xem lịch sử và gửi trả lời thủ công.
   - API được giới hạn theo role `BUYER`/`SELLER`; danh tính người gửi lấy từ JWT.
   - Lịch sử hỗ trợ phân trang bằng `limit` và `skip`, mặc định tải 5 tin mới nhất.
   - Đã khắc phục lỗi Groq `429 OTPM`: tắt reasoning của Qwen và giới hạn phản hồi còn 200 token; backend build và kiểm thử hỏi AI trên Inbox thành công.

2. **Frontend Inbox:** ✅ **Hoàn thành**
   - `/inbox`: Buyer chọn shop, đọc lịch sử, gửi câu hỏi, nhận phản hồi AI và xem VietQR.
   - `/seller/inbox`: Seller chọn khách hàng, kiểm tra lịch sử AI và trả lời thủ công.
   - Hai màn hình tải thêm từng 5 tin cũ, giữ vị trí đang đọc và báo khi đến đầu cuộc trò chuyện.
   - Viewer có nút **Tư vấn riêng với Shop**, truyền `sellerId` để Inbox mở đúng hội thoại.
   - Đã refactor hai Page Inbox theo đúng trách nhiệm: Page chỉ ráp bố cục, hook quản lý dữ liệu và component con đảm nhiệm từng khối giao diện.
   - `InboxPage.tsx` còn 107 dòng và `SellerInboxPage.tsx` còn 106 dòng; Buyer/Seller dùng chung phần hiển thị tin nhắn và logic phân trang.
   - Đã kiểm tra frontend build thành công sau khi refactor.

3. **Viewer Livestream:** 🔄 **Đang tích hợp realtime**
   - Đã tách AI khỏi khung bình luận livestream; AI chỉ tư vấn trong Inbox riêng.
   - Viewer đã tải phiên livestream đang `LIVE`, tham gia đúng Socket room và gửi/nhận bình luận realtime với Live Studio.
   - Nút **Tư vấn riêng với Shop** dùng `sellerId` của phiên live để mở đúng cuộc trò chuyện trong Inbox.
   - Frontend build và kiểm thử kết nối Seller–Buyer thành công.
   - Socket Buyer/Seller gửi JWT khi kết nối; Gateway từ chối token thiếu, sai hoặc hết hạn.
   - Đã đồng bộ `stream_started` và `stream_ended` để Viewer cập nhật trạng thái mà không cần reload.
   - Viewer giữ tối đa 10 comment gần nhất theo `livestreamId` trong `sessionStorage`.
   - Livestream dùng chung `DirectMessageService` để gửi VietQR có tên sản phẩm, SKU, tổng tiền và mã đơn rút gọn.

4. **Giới hạn hiện tại:**
   - Database, Prisma Client và giao diện Inbox đã phân biệt BUYER/SELLER/AI/SYSTEM; cần nghiệm thu nhãn trên trình duyệt với tin mới.
   - Inbox chưa cập nhật realtime; người nhận cần tải lại hội thoại để thấy tin thủ công mới.
   - Bước bảo mật 3B chưa hoàn thành: `send_comment` vẫn cần bỏ `buyerId`/`buyerName` từ payload và lấy danh tính hoàn toàn từ JWT.
   - Lịch sử Live Chat chỉ lưu 10 comment trong tab hiện tại; chưa có lịch sử chung từ Redis hoặc database.

---

## 📝 NHẬT KÝ VÀ KẾ HOẠCH CHI TIẾT CHO KỲ (DEV 2)

### 📌 PHASE 1 - NHIỆM VỤ 1 (PRODUCT & SELLER DASHBOARD)
1. **Backend NestJS (`apps/backend/src/modules/product/`):** ✅ **Hoàn thành**
   - Đã tạo `PrismaService` & `PrismaModule`.
   - Đã viết DTOs: `CreateProductDto`, `UpdateProductDto`.
   - Đã tạo `ProductService`, `ProductController`, `ProductModule` và đăng ký vào `AppModule`.
   - Đã kiểm tra build: `npm run build:backend` thành công 100%.

2. **Frontend React (`apps/frontend/src/`):** ✅ **Hoàn thành**
   - Tạo trang `/seller/dashboard` tại `apps/frontend/src/pages/seller/SellerDashboard.tsx`.
   - Tạo các component sản phẩm tại `apps/frontend/src/components/product/ProductList.tsx` và `ProductModal.tsx`.
   - Tích hợp gọi API Backend CRUD sản phẩm.

### 📌 PHASE 1 - NHIỆM VỤ 2 (AHO-CORASICK AUTOMATON & PARSER MODULE)
1. **Core Aho-Corasick Algorithm (`apps/backend/src/core/aho-corasick/`):** ✅ **Hoàn thành**
   - Xây dựng cây Automaton bóc tách mã SKU trong câu comment với thời gian < 1ms.
   - Xử lý Failure links BFS không phân biệt hoa thường và chuẩn hóa dữ liệu.

2. **Backend Parser Module (`apps/backend/src/modules/parser/`):** ✅ **Hoàn thành**
   - Đã tạo `ParserService` bóc SĐT Việt Nam (Regex) & SKU (Aho-Corasick), trả về kết quả `isOrder`.
   - Đã tạo `ParserModule` và đăng ký vào `AppModule`.
   - Đã kiểm tra build thành công 100%.

### 📌 PHASE 1 - NHIỆM VỤ 3 (ORDER ENGINE & ATOMIC STOCK DEDUCTION)
1. **Backend NestJS (`apps/backend/src/modules/order/`):** ✅ **Hoàn thành**
   - Đã tạo DTOs: `CreateOrderDto`, `OrderItemDto` với class-validator & class-transformer.
   - Xây dựng `OrderService` trừ kho nguyên tử (Atomic Stock Deduction):
     - Dùng Prisma Transaction kiểm tra và trừ kho: `stock >= quantity` và `decrement: quantity`.
     - Chống Oversell tuyệt đối khi nhiều khách hàng cùng chốt 1 sản phẩm.
     - Tính tổng tiền đơn hàng và tạo bản ghi `Order` cùng danh sách `OrderItem`.
   - Xây dựng `OrderController` (`POST /orders`, `GET /orders/:id`) và đăng ký `OrderModule` vào `AppModule`.
   - Build và khởi động chạy thử nghiệm thành công 100%.

### 📌 PHASE 1 - NHIỆM VỤ 4 (LIVESTREAM SOCKET GATEWAY & LIVE STUDIO WEBCAM UI)
1. **Backend NestJS Livestream Module (`apps/backend/src/modules/livestream/`):** ✅ **Hoàn thành**
   - Tạo `LivestreamGateway` WebSocket với `@WebSocketGateway`.
   - Xử lý các sự kiện `join_room`, `leave_room`, `send_comment`.
   - Tích hợp thuật toán Aho-Corasick bóc SKU và trừ kho Atomic bằng `OrderService`.
   - Phát sự kiện Socket `new_order` nổ đơn trực tiếp và tự động bắn mã VietQR về Inbox của Buyer.
   - Đăng ký `LivestreamModule` vào `AppModule`.

2. **Frontend React Live Studio UI (`apps/frontend/src/pages/seller/LiveStudio.tsx`):** ✅ **Hoàn thành**
   - Tích hợp WebCam camera trực tiếp với HTML5 `getUserMedia`.
   - Bật/tắt mic và camera linh hoạt.
   - Kết nối `socket.io-client` hiển thị bình luận trực tiếp và hiệu ứng Alert Nổ Đơn Hàng Nhanh (`new_order`).
   - Đăng ký route `/seller/live-studio` và cập nhật nút truy cập trên Navbar.
   - Build kiểm tra thành công 100%.


