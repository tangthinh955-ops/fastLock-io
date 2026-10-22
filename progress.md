# TIẾN ĐỘ DỰ ÁN: LIVEORDER CHỐT ĐƠN ENGINE

## Cập nhật 22/10/2026 — S19 sửa AI lặp thông tin sản phẩm cũ trong lịch sử (Dev 1)

- ✅ Hoàn thành bước sửa đã được yêu cầu: khi tư vấn sản phẩm, ưu tiên nguồn Product vừa đọc từ DB; giữ lịch sử để hiểu mẫu/nhu cầu/chiều cao/cân nặng. Tiếp tục trên `feat/s19-rag-demo`, giữ nguyên staging có trước, không commit/push.
- Chẩn đoán bằng dữ liệu thực tế: SP03 Áo thun basic và SP04 Áo sơ mi nam đã có vector hợp lệ, retrieval chọn đúng hai nguồn mới. Replay Groq với lịch sử lặp nhiều lần vẫn trả SP01/SP02; cùng câu hỏi bỏ lịch sử thì trả nguồn mới. Lỗi quan sát nằm ở bước sinh câu trả lời, không phải DB chưa lưu hoặc vector chưa tạo.
- AiService gửi một system prompt quy định thẩm quyền nguồn, giữ nguyên lịch sử native-role trong giới hạn cũ, rồi một lượt user cuối chứa nguồn hiện tại và câu hỏi nguyên văn có delimiter. Nguồn chỉ gửi một lần; không dựa vào system message thứ hai giữa hội thoại. Quy tắc tên/SKU/giá/kho theo nguồn Product hiện tại, không điền bằng tin AI cũ khi thiếu dữ liệu; giữ KB cho bảng size/chính sách. Không thay query/retrieval/API/Socket/mode/version.
- Cảnh báo rõ kết quả truy xuất chỉ là một phần danh mục, không có tổng số loại/mẫu; câu hỏi tổng số phải nói chưa đủ dữ liệu và chỉ giới thiệu ứng viên đang có nguồn. Chưa xây dựng chức năng thống kê/liệt kê đầy đủ danh mục.
- Thêm regression test bắt đúng cấu trúc request: nhiều câu trả lời cũ vẫn giữ nguyên, dữ liệu Product mới ở lượt cuối, không nhân đôi nguồn. Đã chạy test fail trước rồi sửa pass; unit test chỉ xác minh request, không giả lập bằng chứng chất lượng Groq. Review độc lập không thấy blocker trong diff tạo request.
- Kiểm tra cuối: **5 suite / 89 test AI/Inbox pass**, Backend build thành công, Prettier và git diff --check đạt. Frontend không đổi nên không chạy lại build Frontend ở bước này.
- Groq thật trên bản cuối: giữ lịch sử cũ vẫn trả SP04/SP03; tin thử cũ báo SP04 giá 100.000đ/kho 1 nhưng câu mới trả đúng DB 300.000đ/kho 5; hỏi tổng loại áo trả chưa có tổng số và giới thiệu SP03/SP04; câu nối tiếp dùng đúng 170cm/65kg và thích mặc rộng, không hỏi lại số đo đã có. Đây là các lượt thử thực tế có giới hạn, không bảo đảm mọi câu hỏi/mọi lần sinh đều chính xác.
- [MODIFY]: `apps/backend/src/modules/ai/ai.service.ts`, `apps/backend/src/modules/ai/ai.service.spec.ts`, `docs/s19-demo.md`, `progress.md`. Không tạo file, không đổi schema/dependency, không chạy migration hoặc xóa lịch sử; script chẩn đoán không lưu câu trả lời vào Inbox. Không sửa file Dev 2/[CHUNG].
- S19 vẫn cần nghiệm thu trình duyệt và bộ đánh giá A/B theo plan; không suy ra cải thiện token/độ chính xác tổng quát từ riêng lỗi đã sửa.

---

## Cập nhật 22/10/2026 — S19 mở rộng tìm Product bằng RAG (Dev 1)

- ✅ Hoàn thành phần code và kiểm tra tự động Product RAG đã duyệt trên `feat/s19-rag-demo`; chưa nghiệm thu toàn bộ S19. Giữ nguyên staging của phần KB có trước, không commit/push.
- Thêm bảng ProductEmbedding (productId PK/FK, vector/hash/model) và quan hệ ngược trong Product theo phạm vi schema đã duyệt. Migration `20261022010000_add_product_embeddings` chỉ tạo bảng/FK cascade, đã deploy vào DB `.env` localhost:5432; cả 5 migration up to date. Prisma generate/validate đạt; không reset/xóa dữ liệu cũ.
- ProductRetrievalService đọc Product đúng sellerId, ưu tiên SKU chính xác; không thay mã thiếu bằng mẫu gần nghĩa. Không có mã thì embed câu hỏi, cosine với vector tên + SKU, tối đa 2 Product. Vector thiếu/cũ tạo bù tối đa 16/lượt, chống tác vụ trùng; giá/kho không nằm trong vector và được đọc lại từ DB trước khi dựng prompt. Product xóa thì vector xóa cascade; tên/SKU đổi thì chỉ mục được tạo lại khi retrieve.
- AiService ghép Product + KB tối đa 3 nguồn/4.000 ký tự, dành chỗ cho hai loại nguồn nếu phù hợp và vừa ngân sách, dùng chung một vector truy vấn. Prompt cho phép báo snapshot giá/kho nhưng không giữ hàng/tạo đơn/xác nhận thanh toán; không bịa màu/size/chất liệu thiếu dữ liệu. Giữ API Inbox, lịch sử, Socket và mode/version/HUMAN.
- Rà soát độc lập phát hiện lỗi SKU có dấu nối và ngữ cảnh đổi mẫu; đã thêm regression test, xác minh test fail rồi sửa: AO-SP01 không bị tách, SP01-RED không lấy SP01, AO-KHAC viết hoa chưa có thì báo thiếu; “Còn áo polo” không kéo SKU cũ. “Vậy áo còn hàng không?”/trả lời cân nặng và áo rộng vẫn giữ ngữ cảnh; tên T-shirt không bị mặc định coi là mã. Nhận diện câu nối tiếp vẫn dùng heuristic, mã tự do nên ghi rõ SKU để tránh mơ hồ.
- Kiểm tra: 5 suite AI/Product retrieval/KB retrieval/Inbox Gateway/Inbox Service, **88 ca pass**; Backend và Frontend build đạt (Frontend còn cảnh báo bundle >500 kB). Không chạy toàn bộ suite scaffolding ngoài phạm vi. Đã tách cosine/kiểm tra vector dùng chung vào vector.utils, không thay đổi embedding model/dependency.
- PostgreSQL + embedding local thật: 4 sản phẩm thử tạo 4 vector, service mới dùng lại không embed passage; đổi giá/kho không embed lại; đổi tên chỉ tạo lại 1 vector; xóa Product xóa vector; không lẫn Shop/mã gần giống. Câu áo sơ mi/áo phông/quần bò đứng đầu đúng nguồn trong bộ thử nhỏ, nhưng điểm các mẫu gần nhau nên chưa kết luận chất lượng tổng quát.
- HTTP + Groq thật: câu hỏi kết hợp SKU + giá/kho/phí ship trả đúng fixture **125.000đ, 2 sản phẩm, 25.000đ**; mã không tồn tại không bị thay thế; chuyển HUMAN rồi gửi Buyer có aiMessage=null. Toàn bộ user/KB/Product/conversation/tin/vector fixture đã dọn; dữ liệu nghiệp vụ còn 9 User/2 Product/4 KB/18 Live/10 Order/10 OrderItem/1 Conversation/24 DirectMessage như trước phần Product này (khác mốc 17 Live của lần kiểm tra KB trước đó).
- [CREATE]: migration Product nêu trên; `ai/product-retrieval.service.ts`; `ai/product-retrieval.service.spec.ts`; `ai/vector.utils.ts`. [MODIFY]: `prisma/schema.prisma`; `ai/ai.service.ts`; `ai/ai.service.spec.ts`; `ai/ai.module.ts`; `ai/knowledge-retrieval.service.ts`; `docs/s19-demo.md`; `plan.md`; `progress.md`. Không sửa CRUD Product/Order/Parser/Livestream/Live Studio hoặc API DirectMessage. `KY_GUIDE.md` không có nên không tạo ngoài kế hoạch.
- Còn lại: nghiệm thu Buyer/Seller trên trình duyệt, thử ngữ cảnh khó và đủ bộ A/B ít nhất 20 tình huống theo plan mục 7.5; chưa tuyên bố token/độ chính xác tốt hơn baseline khi chưa đo.

---

## Cập nhật 22/10/2026 — S19 demo KB: RAG local và vector PostgreSQL (Dev 1)

- ✅ Hoàn thành code và kiểm tra tự động bản demo KB trên `feat/s19-rag-demo`; chưa đánh dấu hoàn thành toàn bộ S19 PA2. Giữ thay đổi local có trước trong plan/progress, không tự commit/push.
- Tạo EmbeddingService dùng Transformers.js 3.8.1, Xenova/multilingual-e5-small q8/mean/L2/prefix query-passage, vector 384 chiều; dùng chung loader và xếp hàng inference để giới hạn tải CPU/RAM. Thử tiếng Việt/offline sau cache thành công; số liệu và giới hạn ghi tại docs/s19-demo.md.
- Tạo KnowledgeRetrievalService: lưu Float[]/embeddingModel/embeddingHash trong KbEntry, tái sử dụng vector đúng hash/model sau khi tạo lại service, tạo bù có giới hạn lô 16, chống embed passage trùng, lưu có điều kiện theo nội dung/owner, kiểm tra lại nguồn sau inference. Cosine theo đúng Shop, tối đa 3 nguồn/4.000 ký tự; ngưỡng thử ban đầu 0,82 chưa phải kết quả đánh giá chính thức. Timeout 30 giây trả thông báo kiểm tra; không fallback sang full-KB không giới hạn.
- Migration `20261022000000_add_kb_embeddings` chỉ thêm 3 cột và index sellerId, đã áp dụng trên database `.env` ở localhost:5432 sau khi xác nhận 3 migration cũ đều đã áp dụng. Không reset, không chạy lại migration xóa tin cũ. Prisma Client generate thành công; cả 4 migration up to date. Đã tạo vector cho 4 KB hiện có, không đổi tiêu đề/nội dung.
- AiService chỉ ghép nguồn truy xuất vào prompt, giữ lịch sử/mode/version/Socket. Bổ sung ngữ cảnh cho câu nối tiếp và trả lời chiều cao/cân nặng; câu có SKU mới không kéo ngữ cảnh SKU cũ. Không có nguồn thì báo thiếu dữ liệu, embedding lỗi thì báo kiểm tra, không gọi Groq bằng full-KB. Log nguồn/độ trễ và token usage nếu có, không log toàn hội thoại hoặc khóa.
- Gỡ giới hạn 20 tại Service/Controller và AiSettingsPage; giao diện/validation dùng Tiêu đề/Nội dung kiến thức, giữ API keyword/answer và giới hạn 100/1.000 ký tự. GET/POST/DELETE KB không đưa vector ra response. Chỉ sửa trang Seller AI đã được duyệt, không sửa Product/Order/Parser/Live Studio hoặc logic DirectMessage.
- Kiểm tra: 4 bộ test AI/retrieval/Inbox, 64 ca pass; build Backend và Frontend thành công, Frontend còn cảnh báo bundle >500 kB. Test được viết/chạy fail trước phần tương ứng, sau sửa chạy pass. Review độc lập chỉ ra mất ngữ cảnh câu trả lời chiều cao/cân nặng; đã thêm 2 regression test và sửa, đều pass.
- PostgreSQL + embedding thật: tạo 21 mục qua AiService, đúng 21 passage embedding; hai Shop không lẫn nguồn; dùng lại vector DB, sửa chỉ embed lại mục đó, nguồn xóa không còn trong kết quả, câu ngoài dữ liệu bị loại. HTTP thật: tạo/list KB, ẩn vector, chặn Buyer 403, tiêu đề quá dài 400. HTTP + Groq thật trả đúng phí ship theo fixture; HUMAN trả aiMessage=null. Lỗi kết nối Groq trong sandbox được xác minh bằng request ngoài sandbox thành công.
- Dữ liệu test tạm đã dọn; còn 9 User/2 Product/4 KB/17 Live/10 Order/10 OrderItem/1 Conversation/24 DirectMessage như trước. Hash nội dung 4 KB trước/sau khớp. Chưa nghiệm thu giao diện bằng trình duyệt, toàn bộ 8 tình huống với Groq/UI, bộ 20 tình huống A/B hoặc Product/giá/kho sống. Không tuyên bố hoàn tất S19 đầy đủ hay token/độ chính xác cải thiện khi chưa đo.
- File CREATE: migration nêu trên; ai/embedding.service.ts; ai/knowledge-retrieval.service.ts; ai/knowledge-retrieval.service.spec.ts; docs/s19-demo.md. File MODIFY: schema.prisma; ai.service.ts/spec.ts/controller.ts/module.ts; dto/create-kb.dto.ts; seller/AiSettingsPage.tsx; backend/package.json; package-lock.json; plan.md; progress.md. KY_GUIDE.md không có nên không tạo ngoài kế hoạch.

---

## Cập nhật 19/10/2026 — S08: Quản lý Vòng đời Đơn hàng & Hoàn kho Atomic khi Hủy đơn (Dev 2 - Kỳ)

- ✅ **Hoàn thành S08 (Order Lifecycle & Hoàn kho Atomic):**
  - Tạo DTO `UpdateOrderStatusDto` xác thực enum `OrderStatus` (`PENDING`, `PAID`, `CANCELLED`).
  - Tạo DTO `GetOrdersQueryDto` hỗ trợ phân trang (`page`, `limit`) và lọc trạng thái đơn hàng.
  - Cập nhật `OrderService`:
    - `getOrdersForSeller`: Lấy danh sách đơn của shop đang đăng nhập, phân trang, lọc theo trạng thái, bao gồm chi tiết sản phẩm, phiên live và khách hàng.
    - `getOrdersForBuyer`: Lấy lịch sử đơn hàng của người mua đang đăng nhập.
    - `updateOrderStatus`: Kiểm tra quyền sở hữu đơn hàng của shop, kiểm soát chuyển trạng thái hợp lệ (chặn chuyển ngược `PAID` → `PENDING` hoặc sửa đơn đã `CANCELLED`).
    - **Hoàn kho Atomic:** Khi đơn hàng chuyển sang `CANCELLED`, hệ thống tự động hoàn lại số lượng tồn kho nguyên tử (`stock: { increment: quantity }`) cho từng sản phẩm trong Prisma transaction.
  - Cập nhật `OrderController`: Mở các endpoints `@Get('seller')` (Role: SELLER), `@Get('buyer')` (Role: BUYER), và `@Patch(':id/status')` (Role: SELLER) với đầy đủ JwtAuthGuard và RolesGuard.
  - Frontend:
    - Xây dựng component `SellerOrderTable.tsx` hiển thị danh sách đơn hàng, chip trạng thái trực quan, bộ lọc trạng thái, phân trang và các nút hành động "Xác nhận thanh toán" / "Hủy & Hoàn kho".
    - Tích hợp hệ thống Tabs ("Quản lý Sản phẩm & Tồn kho" và "Quản lý Đơn hàng Livestream") trong `SellerDashboard.tsx`.
- **Kiểm tra build:** `npm run build:backend` và `npm run build:frontend` đều thành công 100% không còn lỗi TypeScript.

---

## Cập nhật 19/10/2026 — S02: Chuẩn hóa Seed UUID v4 Deterministic & Dọn dẹp Fallback (Dev 2 - Kỳ)

- ✅ **Hoàn thành S02 (Chuẩn hóa Seed UUID v4 Deterministic):**
  - Cập nhật `apps/backend/prisma/seed.ts`: Thay thế các ID dạng text (`admin-uuid-001`, `seller-uuid-001`, `buyer-uuid-001`) bằng các hằng số UUID v4 chuẩn RFC 4122 (`a0000000-0000-4000-8000-000000000001`, `...0002`, `...0003`).
  - Khắc phục triệt để lỗi `400 Bad Request` khi gọi các API DirectMessage và Order có gắn `@IsUUID('4')` với tài khoản seed.
  - Cập nhật `apps/backend/src/modules/order/order.service.ts`: Xóa bỏ hoàn toàn fallback `buyerId || 'buyer-uuid-001'`, kiểm tra bắt buộc `buyerId` hợp lệ để đảm bảo tính toàn vẹn dữ liệu đơn hàng.
  - Cập nhật `apps/frontend/src/pages/seller/SellerDashboard.tsx`: Chuyển fallback an toàn `sellerId` sang UUID v4 (`a0000000-0000-4000-8000-000000000002`).
- **Kiểm tra build:** `npm run build:backend` và `npm run build:frontend` đều thành công 100% không còn lỗi TypeScript.

---

## Cập nhật 19/10/2026 — S01, S03 & Bảo vệ Dữ liệu Livestream (Dev 2 - Kỳ)

- ✅ **Hoàn thành S01 (Auth Guards & Phân quyền Tài nguyên):**
  - Tạo decorator `@CurrentUser()` trích xuất an toàn payload JWT (`userId`, `role`, `email`).
  - Bảo vệ `ProductController`: `@UseGuards(JwtAuthGuard, RolesGuard)` và `@Roles(Role.SELLER)` cho `POST`, `PATCH`, `DELETE`. Các endpoint `GET` vẫn mở public để viewer xem danh mục.
  - Phân quyền trong `ProductService`: `create`, `update`, `remove` sử dụng `sellerId` từ token JWT, ngăn chặn can thiệp sản phẩm giữa các shop khác nhau (`ForbiddenException`).
  - Bảo vệ `OrderController`: `@UseGuards(JwtAuthGuard)` trên `POST /orders` (tự động gán `buyerId` từ token) và `GET /orders/:id`. `OrderService.getOrderById` kiểm tra quyền sở hữu (Buyer chỉ xem đơn của mình, Seller chỉ xem đơn phát sinh từ live của shop mình).
  - Bảo vệ `LivestreamController`: `@UseGuards(JwtAuthGuard, RolesGuard)` và `@Roles(Role.SELLER)` cho `POST /livestreams` và `PATCH /livestreams/:id/end`. `LivestreamService.endStream` kiểm tra quyền sở hữu phiên live.
- ✅ **Hoàn thành S03 (Xác thực Socket & Định danh Buyer):**
  - `LivestreamGateway`: Trong sự kiện `send_comment`, trích xuất `buyerId` và `buyerName` trực tiếp từ `client.data.user` (đã verify qua JWT handshake), loại bỏ việc tin tưởng `buyerId` gửi từ client payload.
  - `LivestreamCommentProcessor`: Loại bỏ triệt để fallback `buyer-uuid-001`. Nếu bình luận chứa SKU & SĐT nhưng buyer chưa xác thực danh tính, hệ thống bỏ qua chốt đơn và ghi log cảnh báo.
  - Refactor `LiveStudio.tsx`: Thay thế gọi `axios.post` trực tiếp bằng `apiClient` để tự động đính kèm `Bearer token`.
- ✅ **Bảo vệ Quyền riêng tư (SĐT):**
  - Server-side Masking: Tự động che số điện thoại (`0912***678`) trước khi emit sự kiện `new_order` tới toàn bộ người xem trong phòng livestream.
- **Kiểm tra build:** `npm run build:backend` và `npm run build:frontend` đều thành công 100% không còn lỗi TypeScript.

---

## Cập nhật 16/10/2026 — S19 theo mốc nghiệm thu, bỏ giới hạn thời gian

- ✅ Hoàn thành cập nhật tài liệu theo yêu cầu người dùng: `plan.md` v2.4 bỏ mục tiêu 7 ngày và lịch chia theo ngày của S19. Thay bằng bốn mốc: thử nghiệm/chốt phương án → triển khai → kiểm thử/đo A/B → báo cáo/demo; chuyển mốc khi có kết quả kiểm chứng, không ấn định số ngày.
- Đồng bộ mục ưu tiên 1.2, dòng S19 trong bảng phiên, bảng phân công S19 và mục 7.6. Giữ phạm vi PA2, dependency, phân công Product/[CHUNG], fallback, tiêu chí nghiệm thu và việc Kỳ xử lý lỗi chốt đơn song song.
- Các nhật ký cũ nhắc lịch theo ngày là lịch sử quyết định; quy định tiến độ hiện hành là các mốc nghiệm thu tại `plan.md` v2.4. S19 vẫn chưa triển khai, chưa có kết quả thử model hoặc RAG để đánh dấu tính năng hoàn thành.
- Chỉ cập nhật `plan.md` và `progress.md` trên nhánh hiện tại; không sửa code/schema, cài dependency hoặc chạy migration. `KY_GUIDE.md` không có nên không tạo thêm.
- Kiểm tra: `plan.md` không còn mục tiêu 7 ngày/lịch ngày 1–7; có đủ bốn mốc, bảng phiên giữ 19 dòng với 8 cột; `git diff --check` đạt. Build Backend/Frontend chạy lại thành công, Frontend còn cảnh báo bundle >500 kB. Yêu cầu cấp quyền stage Git bị người dùng từ chối; thay đổi hiện chỉ lưu trong workspace, chưa stage/commit/push.

---

## Cập nhật 16/10/2026 — Làm rõ thứ tự ưu tiên và dependency trong plan

- ✅ Hoàn thành cập nhật tài liệu theo yêu cầu người dùng: `plan.md` v2.3, thêm mục 1.2 giải thích S01–S19 là mã đầu việc, không bắt buộc làm tuần tự. Thịnh ưu tiên thử nghiệm S19 ngày 1; Kỳ sửa lỗi bảo mật/chốt đơn song song và phối hợp điểm tích hợp Product.
- Thêm hai cột trạng thái/dependency cho đủ 19 đầu việc, tổng hợp từ nhật ký và lần rà soát 15/10. S05 đã có code/kiểm tra tự động nhưng chưa nghiệm thu UI/Groq thật; S06 còn reconnect/unread; S19 mới chốt PA2, chưa triển khai. Phần chưa có bằng chứng triển khai ghi “chưa ghi nhận”, không tự đánh dấu hoàn thành.
- Làm rõ S19 dùng nền S05/S06 A/B/C1 hiện có, không phải chờ toàn bộ S01–S18 hoặc phần reconnect/unread/Payment. Ngày 1 vẫn phải thử model, chọn cách lưu vector và xác nhận lại mục tiêu 7 ngày; Product/file [CHUNG] tuân theo phân công và phê duyệt trước code.
- Tách nghiệm thu RAG theo mục 7.5 khỏi nghiệm thu toàn hệ thống. Demo chung vẫn cần sửa các lỗi bảo mật/chốt đơn, hoàn thiện các luồng liên quan và kiểm thử hai phía Buyer–Seller. Ghi rõ S07 phụ thuộc Payment S08, S11 phụ thuộc dữ liệu PAID; các màn Orders/thông tin người nhận còn phải chốt nhiệm vụ/owner riêng.
- Chỉ cập nhật `plan.md` và `progress.md` trên nhánh hiện tại theo yêu cầu; không sửa code/schema, cài dependency, chạy migration hoặc thay đổi trạng thái tính năng thành hoàn thành. `KY_GUIDE.md` không có nên không tạo thêm.
- Kiểm tra: bảng đủ 19 dòng, mỗi dòng 8 cột và giữ nguyên nội dung 6 cột gốc; rà soát độc lập không phát hiện sai lệch với các nội dung đã duyệt; `git diff --check` đạt. Build Backend và Frontend chạy lại thành công trước commit/push; Frontend còn cảnh báo bundle >500 kB. Thực hiện commit/push hai file tài liệu trên nhánh hiện tại theo yêu cầu đã có của người dùng.

---

## Cập nhật 15/10/2026 — S19 đổi sang kế hoạch PA2

- ✅ Hoàn thành cập nhật tài liệu theo yêu cầu người dùng: `plan.md` v2.2, dòng S19 trong bảng phiên và mục 7 thống nhất PA2 embedding local bằng Transformers.js, truy xuất KbEntry + tên/SKU Product đúng Shop, lấy giá/kho sống từ DB. Groq giữ vai trò sinh câu trả lời; không thêm PDF/UI hoặc database vector chuyên dụng.
- Bổ sung query theo ngữ cảnh, ưu tiên SKU chính xác, top-k tối đa 3–5 có lọc mức liên quan/tag nguồn, embed bù dữ liệu cũ, chống embed trùng, cập nhật/vô hiệu hóa nguồn và model/version. Lưu RAM hay PostgreSQL và model cụ thể còn phải chốt trước code; migration chỉ thực hiện nếu phương án lưu được duyệt cần tới.
- Nêu rõ Thịnh lead AI/retrieval/KB; Kỳ phụ trách tích hợp Product; schema/module integration [CHUNG] cần duyệt. Hook gọi trong Product không thay thế cơ chế xử lý tạo/sửa/xóa và lỗi embedding; lỗi embedding không được làm báo thất bại sau khi Product đã lưu.
- Giữ takeover/Socket/API contract; embedding lỗi có timeout và fallback full-KB đúng Shop, ghi nhận fallback riêng. Đo A/B gồm baseline hiện tại và đối chiếu cùng nguồn KB + Product; ít nhất 20 tình huống, đo chất lượng/nguồn/token/độ trễ và tách lần đầu/có cache. Mục tiêu 7 ngày gồm báo cáo/demo được xác nhận sau thử nghiệm ngày 1.
- Chỉ sửa `plan.md` và thêm nhật ký này, giữ phần đánh giá dự án đã có; không sửa code/schema, cài dependency, chạy migration hoặc đổi trạng thái tính năng S19 thành hoàn thành. Yêu cầu tạo nhánh `docs/s19-pa2-plan` bị người dùng từ chối, nên cập nhật trên nhánh hiện tại; không commit/push. `KY_GUIDE.md` không có nên không tạo thêm.
- Người dùng sau đó yêu cầu bổ sung trực tiếp và push trên nhánh hiện tại, không tạo nhánh mới. Kiểm tra trước commit/push: build Backend và Frontend chạy lại thành công; Frontend còn cảnh báo bundle >500 kB. Commit chỉ gồm `plan.md` và `progress.md`, bao gồm nhật ký đánh giá dự án đã thực hiện trong cùng phiên; không sửa code.

---

## Cập nhật 15/10/2026 — Đánh giá lại toàn bộ dự án

- ✅ Hoàn thành đầu việc rà soát code và kiểm tra tự động trên bản hiện tại của nhánh `docs/readme-env-example`, commit `964dae8`. Đối chiếu backend, frontend, schema/migrations, README và kế hoạch; không sửa code, schema, dependency hoặc dữ liệu database, không commit/push. Trạng thái này chỉ áp dụng cho đầu việc đánh giá, không xác nhận các tính năng còn thiếu đã hoàn thành.
- Kết quả thực chạy: `npm.cmd run build:backend` và `npm.cmd run build:frontend` thành công. Bundle Frontend 696,91 kB, gzip 218,55 kB, còn cảnh báo >500 kB. `npm.cmd test --workspace apps/backend -- --runInBand`: 3/5 bộ test đạt, 47/49 ca đạt; hai test Controller AI/DirectMessage lỗi thiếu provider/mock. Frontend lint chạy thành công với 10 cảnh báo. `npm.cmd run start:prod --workspace apps/backend` thất bại MODULE_NOT_FOUND: script tìm `dist/main` nhưng build tạo `dist/src/main.js`.
- Ưu tiên bảo mật/nghiệp vụ: Product/Order/Livestream HTTP chưa có JWT/role/ownership guards; `send_comment` vẫn dùng Buyer từ payload thay vì JWT; `new_order` và comment phát SĐT chưa che tới phòng live. Order API chưa kiểm tra sản phẩm thuộc đúng Shop và live đang LIVE. VietQR dùng tài khoản cố định; API tạo tin SYSTEM nhận amount/orderId từ client mà chưa đối chiếu đơn.
- Kiểm chứng trong bộ nhớ bằng module đã build: comment `SP010 0912345678` với SKU `SP01`, `SP010` trả cả hai mã theo thứ tự SP01 trước, processor chọn mã đầu nên có thể chốt nhầm; DTO Order chấp nhận `items:[]`; metadata ba Controller Product/Order/Livestream không có guard. Không tạo file test hoặc dữ liệu thử trong database.
- Độ ổn định còn thiếu: order đã commit nhưng lỗi lưu tin QR chưa có retry/idempotency; Inbox chưa tải bù tin/mode sau reconnect và chưa đồng bộ unread khi tin mới tới; LiveStudio chưa xử lý camera trả về muộn và vẫn xóa trạng thái live khi API kết thúc thất bại. Auth throttle khai báo `default` trong khi cấu hình tên `global`, nên giới hạn 5 lần/phút chưa được áp dụng đúng.
- Điểm tốt giữ lại: trừ kho có điều kiện trong transaction cùng Order, snapshot giá từ server; Inbox tách cặp Buyer–Seller và nguồn BUYER/SELLER/AI/SYSTEM, phát sau lưu; tiếp quản dùng mode/version để loại AI lỗi thời; frontend đã tách hook/component theo trách nhiệm, gộp tin theo ID và bảo vệ phản hồi hội thoại cũ.
- Chưa nghiệm thu trình duyệt hai phiên Buyer/Seller, Groq thật, benchmark <1ms, webhook hoặc thanh toán thật. RAG S19 chưa triển khai; S06 còn reconnect/unread; S07/S08 còn QR theo Shop và vòng đời thanh toán/hủy/hoàn kho. Docker hiện chỉ gồm Postgres/Redis, chưa có pipeline CI trong cây file được rà soát. Seed chưa phải UUID v4; migration nguồn tin có DELETE lịch sử Inbox như README đã ghi.
- `KY_GUIDE.md` không có trong workspace nên không tạo thêm file. Chỉ cập nhật nhật ký đánh giá này; không đổi các mốc tính năng cũ sang hoàn thành.

---

## Cập nhật 14/10/2026 — README và môi trường mẫu

- ✅ Hoàn thành tài liệu trên nhánh `docs/readme-env-example`: mở rộng README gốc và thêm `apps/backend/.env.example` gồm DATABASE_URL/JWT_SECRET/GROQ_API_KEY/PORT. Giá trị mẫu khớp Docker PostgreSQL host 5433; JWT là placeholder, Groq để trống, không sao chép khóa thật.
- README hướng dẫn cài gói, tạo `.env`, chạy Docker, generate/migrate Prisma, khởi chạy hai workspace, đường dẫn màn hình, demo và build/test tập trung. Phân biệt database mới/cũ, ghi rõ migration nguồn tin có DELETE Inbox và seed có ID chưa phải UUID v4; không reset database hoặc chạy seed/migration trong đầu việc này.
- Ghi đúng hạn chế hiện tại: Frontend dùng API localhost:3001 nên không thêm env frontend chưa được sử dụng; đồng bộ trạng thái đã đọc/tải bù khi reconnect của S06, thanh toán tự động và RAG còn chưa hoàn thiện/triển khai. Không sửa code, schema, dependency hoặc module Dev2.
- Kiểm tra: build Backend và Frontend thành công; cảnh báo bundle Frontend >500 kB còn tồn tại. File mẫu parse được bằng dotenv, có đúng bốn biến và giá trị local/placeholder; kiểm tra đường dẫn/lệnh README và `git diff --check` đạt. Git bỏ qua `.env` thật nhưng không bỏ qua `.env.example`. Chưa nghiệm thu cài mới trên máy/database trống; các lệnh setup được đối chiếu với cấu hình hiện tại, không chạy thay đổi database.
- Commit/push riêng phần tài liệu theo yêu cầu người dùng; `KY_GUIDE.md` không có nên không tạo thêm file ngoài kế hoạch.

---

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


