# S19 — Demo RAG trên Knowledge Base + Product

## Phạm vi đã duyệt ngày 22/10/2026

- Giao diện nhập Tiêu đề/Nội dung; API giữ keyword/answer để tương thích.
- Bỏ giới hạn 20 mục, giữ giới hạn độ dài từng mục và ngữ cảnh.
- Embedding local bằng Transformers.js; thử Xenova/multilingual-e5-small q8, mean pooling, chuẩn hóa L2, prefix query/passage.
- Lưu vector, model/preprocessing key và hash nội dung trong KbEntry và bảng riêng ProductEmbedding trên PostgreSQL; không dùng pgvector hoặc migration xóa dữ liệu.
- Chọn tối đa 3 nguồn, tổng tối đa 4.000 ký tự. Dùng dữ liệu đúng Shop và kiểm tra nguồn chưa bị sửa/xóa.
- Giữ DirectMessage, Socket, lịch sử và cơ chế HUMAN/mode/version. Mở rộng Product đã duyệt: chỉ sửa schema để thêm chỉ mục, không sửa CRUD của Dev 2; cho phép báo snapshot giá/kho từ DB, không xác nhận giữ hàng/đơn/thanh toán.
- Embedding lỗi/timeout: thông báo cần kiểm tra, không gửi toàn bộ KB không giới hạn cho Groq.
- Không commit/push tự động. Giữ thay đổi tài liệu local có trước tính năng.

## Nhật ký thực hiện

| Bước | Trạng thái và bằng chứng |
|---|---|
| Chuẩn bị | Nhánh feat/s19-rag-demo; giữ hai file tài liệu local. Baseline 3 bộ test AI/Inbox: 47 ca pass. |
| A — Embedding | Đạt thử nghiệm local: vector 384 chiều, 4 câu tiếng Việt tìm đúng nguồn đứng đầu. Chạy được với allowRemoteModels=false sau khi model đã được cache. |
| B — Schema/vector | Migration 20261022000000_add_kb_embeddings đã áp dụng vào database .env tại localhost:5432; 4 migration up to date. Đã tạo vector cho 4 KB cũ, nội dung giữ nguyên. |
| C — Tích hợp/UI | Đã gắn RAG vào AiService, đổi nhãn form và gỡ giới hạn 20 ở hai đầu. Build Frontend đạt; chưa nghiệm thu bằng trình duyệt. |
| D — Nghiệm thu | 4 bộ test AI/Inbox, 64 ca pass; build hai workspace đạt. PostgreSQL + embedding thật và HTTP + Groq thật đã kiểm tra; các ca UI/nghiệp vụ đầy đủ còn cần test thủ công. |
| E — Product RAG | ProductEmbedding + migration đã deploy, 5 migration up to date; 5 suite/88 test AI/Inbox pass, build hai workspace đạt. Giá/kho/sửa/xóa/tái dùng vector kiểm tra DB thật; HTTP/Groq kết hợp Product + KB trả đúng fixture. Chưa nghiệm thu UI/A-B đầy đủ. |

Quyết định: dùng nhánh tính năng tại workspace hiện tại theo kế hoạch đã duyệt, không tạo thêm worktree hoặc file cấu hình ngoài phạm vi. Nhật ký trong tài liệu này thay ledger riêng để tránh phát sinh file không cần thiết.

## Tình huống demo cần ghi kết quả thật

| Tình huống | Kết quả mong đợi | Kết quả thực tế |
|---|---|---|
| Phí giao hàng / phí ship | Tìm cùng nguồn chính sách giao hàng | PASS retrieval thật và HTTP/Groq thật: 25.000đ, miễn phí từ 500.000đ theo fixture |
| Hỏi size rồi hỏi tiếp | Dùng đúng ngữ cảnh, không tự đoán sản phẩm | Unit test PASS cho “Vậy chọn size nào?”, trả lời 170cm/65kg và đổi SKU; chưa test chuỗi này với Groq/UI thật |
| Câu cần nhiều nguồn | Chọn các nguồn liên quan trong ngân sách | Unit test top-3/4.000 ký tự chung PASS; HTTP/Groq Product giá/kho + KB phí ship trả đúng fixture |
| Câu ngoài dữ liệu | Hỏi lại hoặc báo thiếu thông tin | Retrieval thật loại câu World Cup; unit test không gọi Groq khi không có nguồn PASS |
| Hai Shop khác chính sách | Không lẫn nguồn giữa Shop | PASS PostgreSQL thật: hai Shop có phí 25.000đ và 99.000đ không trộn nguồn |
| Thêm mục thứ 21 | Lưu được, chỉ mục mới cần embedding | PASS AiService + PostgreSQL thật: 21 mục tạo được, 21 lần embed passage; UI chưa test |
| Xóa nguồn / khởi động lại | Không dùng nguồn xóa; tái sử dụng vector còn hợp lệ từ DB | PASS tạo lại service dùng DB không embed lại passage; sửa một nguồn chỉ embed lại một nguồn, xóa không còn ID nguồn; chưa thử bằng tắt/bật toàn bộ app |
| Embedding lỗi / Seller tiếp quản | Không gửi full-KB; không lưu/phát AI sau takeover | Unit test lỗi embedding và race takeover PASS; HTTP thật chuyển HUMAN rồi gửi Buyer có aiMessage=null |

## Số liệu thử ban đầu (không phải đánh giá A/B chính thức)

- Model/preprocessing: Xenova/multilingual-e5-small, q8, mean, L2, prefix query/passage; vector 384 chiều. Model tải cache lần đầu khoảng 12,5 giây trong lần thử; thời gian này phụ thuộc mạng và máy.
- Một tiến trình Node 22.20 + ts-node thử 4 nguồn/5 câu: khoảng 646 MB RSS; mỗi câu embedding sau khi model đã nạp khoảng 10–21 ms. Không xem đây là mức RAM/độ trễ đảm bảo cho mọi máy.
- Với PostgreSQL và bộ 21 mục thử, retrieval đo được khoảng 56–121 ms sau khi có vector. Ghi tách số liệu này khỏi Groq và HTTP toàn luồng.
- Điểm cao nhất cho các câu thử ship/đổi size/size nam: khoảng 0,839–0,883; câu World Cup cao nhất khoảng 0,789. Ngưỡng khởi đầu 0,82 lấy từ bộ thử nhỏ này, chưa được đánh giá trên tập độc lập; có thể bỏ sót hoặc lấy dư nguồn.
- Giới hạn: top-3 nguồn, 4.000 ký tự kiến thức; lịch sử tối đa 10 tin/4.000 ký tự, phản hồi tối đa 200 token. Giới hạn ký tự không phải giới hạn token và không loại trừ mọi lỗi 429.
- HTTP thật tạo KB, ẩn vector khỏi response, Buyer gọi API quản lý KB bị 403 và tiêu đề >100 ký tự bị 400. Một lượt HTTP/Groq trả đúng phí ship; khi HUMAN thì không gọi AI cho câu mới.
- Tất cả user/KB/tin/conversation của các script kiểm tra đã được dọn. Sau kiểm tra còn 9 User, 2 Product, 4 KB, 17 Live, 10 Order, 10 OrderItem, 1 Conversation, 24 DirectMessage như ban đầu. Hash nội dung KB trước/sau khớp; chỉ thêm metadata/vector cho KB cũ.
- Một lần gọi Groq trong sandbox lỗi kết nối; kiểm tra lại ngoài sandbox thành công. Đây không phải bằng chứng Groq luôn sẵn sàng hoặc hết quota.

## Chạy demo trên máy này

1. Giữ PostgreSQL đang chạy, dùng database đã cấu hình trong apps/backend/.env. Trong phiên này đã xác minh và migrate database ở cổng 5432; không tự chuyển sang 5433 chỉ vì Compose có mapping khác.
2. Tại root chạy hai terminal: `npm run dev:backend` và `npm run dev:frontend`. Nếu PowerShell chặn npm.ps1, dùng npm.cmd.
3. Seller mở `/seller/ai-settings`: nhập Tiêu đề/Nội dung, ví dụ chính sách giao hàng và bảng size; không còn mốc 20.
4. Buyer mở Inbox của đúng Seller, hỏi “Phí ship bao nhiêu?”; đối chiếu câu trả lời với nội dung thực tế của Shop, không dùng số tiền fixture làm đáp án cho mọi Shop.
5. Xem log backend `rag_retrieval`: sourceIds, scores, contextCharacters, backfilled, elapsedMs. Lượt hỏi lặp lại trên KB không đổi phải có backfilled=0. Log `rag_generation` có promptTokens/completionTokens nếu Groq cung cấp.
6. Dừng/chạy lại Backend, hỏi tiếp để kiểm tra vector DB được dùng lại. Model vẫn cần nạp vào RAM mỗi tiến trình; vector KB không phải tạo lại.
7. Seller Tiếp quản; Buyer gửi câu mới để thấy AI không trả lời. Bật lại AI khi cần demo tiếp.

Nguồn KB cũ chưa có vector được tạo bù theo lô tối đa 16 mục/lượt; import lớn có thể cần hỏi lại để hoàn tất chỉ mục. Thêm KB sẽ thử embed ngay sau lưu; embedding lỗi không làm mất dữ liệu đã lưu và được tạo bù khi truy xuất. API vẫn giữ keyword/answer, giao diện hiển thị Tiêu đề/Nội dung.

## Product RAG — cơ chế và kiểm tra ngày 22/10/2026

- Mỗi Product có tối đa một ProductEmbedding, chứa vector từ **tên + SKU**. Hash/model còn đúng thì tái sử dụng; đổi tên/SKU thì tạo lại khi truy xuất, chỉ đổi giá/kho thì không. Không thêm hook hoặc dependency ngược vào CRUD Product.
- Câu hỏi có SKU: tra chính xác trong Shop, không cần vector Product. Mã thiếu thì báo không tìm thấy, không lấy mã tương tự thay thế; hỏi quá 2 mã thì nhờ chọn lại. AO-SP01 và SP01-RED được đọc nguyên mã. Câu hỏi không có SKU: cosine với vector Product của Shop, giữ tối đa 2 ứng viên đạt ngưỡng thử 0,82, kiểm tra lại nguồn trước khi gửi Groq.
- Đọc giá/tồn kho từ Product ngay trước khi ghép prompt; không dùng giá/kho cũ từ vector, KB hay lịch sử. Tổng Product + KB tối đa 3 nguồn/4.000 ký tự; một query embedding dùng chung khi cần tìm cả hai loại. Nếu hai loại đều liên quan và vừa ngân sách, giữ ít nhất một nguồn mỗi loại.
- Mã tự do không thể luôn phân biệt với tên sản phẩm. Demo nhận mã chữ/số, mã chữ viết hoa có dấu nối/gạch dưới, mã catalog biết trước hoặc nhãn “SKU: ...”; tên tự nhiên như T-shirt vẫn tìm ngữ nghĩa. Với mã chữ lạ viết thường hoặc ký tự đặc biệt, nên ghi rõ SKU và kiểm tra lại dữ liệu. Nhận diện câu tiếp nối/đổi mẫu dùng heuristic; trường hợp mơ hồ cần khách xác nhận tên/mã.
- DB + embedding thật (fixture 4 sản phẩm): lần đầu tạo 4 passage, service mới không tạo lại; đổi giá thành 125.000đ/kho 2 không embed lại, đổi tên chỉ tạo lại một passage, xóa Product có cascade vector. Kiểm tra đúng Shop và không thay mã gần giống đạt. Toàn bộ fixture đã dọn.
- Thử ngữ nghĩa: áo sơ mi/áo phông/quần bò đứng đầu đúng nguồn trong bộ nhỏ; có cặp điểm rất sát (áo phông khoảng 0,838 so với 0,836). Đây là tín hiệu cần hỏi lại khi nhiều ứng viên, không phải bằng chứng model phân biệt chính xác mọi sản phẩm. Warm retrieval đo khoảng 37 ms, lượt nạp model khoảng 2.457 ms; không phải độ trễ đảm bảo hoặc số đo toàn luồng.
- HTTP + Groq thật trả: “Dạ áo sơ mi trắng nam ... giá 125.000đ, còn 2 sản phẩm và phí ship là 25.000đ ...” theo fixture. Test mã lạ và HUMAN đạt; sau dọn vẫn 9 User/2 Product/4 KB/18 Live/10 Order/10 OrderItem/1 Conversation/24 DirectMessage như mốc trước Product. Hai sản phẩm thật được tạo vector bù khi có truy vấn ngữ nghĩa, không cần sửa tay hoặc xóa sản phẩm.

Để tự test trên UI: khởi động lại Backend sau generate/migration nếu tiến trình cũ còn chạy; Buyer mở Inbox đúng Shop và hỏi “Shop có [tên sản phẩm thật] không?” rồi “[SKU thật] giá bao nhiêu, còn bao nhiêu và phí ship thế nào?”. Đổi giá/kho qua giao diện Seller hiện có rồi hỏi lại để đối chiếu DB; thử một mã chắc chắn chưa có và nút Tiếp quản. Quan sát log `product_retrieval` (lookup/sourceIds/scores/backfilled/elapsedMs) cùng `rag_retrieval` và `rag_generation`; mỗi log retrieval là ứng viên, nguồn thực sự đưa vào Groq nằm ở rag_generation.

## Sửa câu trả lời bám danh sách sản phẩm cũ — 22/10/2026

- Tình huống thực tế: thêm SP03/SP04 rồi hỏi “shop có đang bán áo nào”, AI vẫn lặp SP01/SP02 từ nhiều câu trả lời trước. Kiểm tra DB/vector và nguồn trong request cho thấy retrieval đã lấy đúng sản phẩm mới; replay có lịch sử tái hiện lỗi, bỏ lịch sử thì trả nguồn mới.
- Luồng gửi Groq hiện tại: **system quy định nguồn → lịch sử giữ nguyên → user turn cuối chứa nguồn vừa truy xuất + câu hỏi nguyên văn**. Tên/SKU/giá/kho ưu tiên Product hiện tại; lịch sử chỉ giúp hiểu khách đang nói tới mẫu nào và thông tin đã cung cấp. Không xóa hội thoại hoặc bỏ mã sản phẩm khỏi câu trả lời.
- Kết quả top-k không phải tổng danh mục. Nếu hỏi “Shop bán mấy loại áo?”, AI được yêu cầu nói chưa có đủ dữ liệu để xác nhận tổng số; có thể giới thiệu các mẫu trong nguồn hiện tại. Chức năng đếm/liệt kê đầy đủ chưa được triển khai trong bước này.
- Bằng chứng bản cuối: 89 unit test AI/Inbox pass, Backend build và kiểm tra format/diff đạt. Groq thật với lịch sử lỗi trả SP04/SP03; SP04 trả đúng 300.000đ/kho 5 dù tin thử cũ ghi 100.000đ/kho 1; câu hỏi tổng số không suy ra tổng từ top-k; câu nối tiếp vẫn sử dụng 170cm/65kg và nhu cầu mặc rộng.
- Để tự kiểm tra: giữ nguyên hội thoại cũ, hỏi lại danh sách hoặc SKU cụ thể sau khi Backend đã nạp code mới. Đối chiếu tên/giá/kho với Seller, rồi hỏi nối tiếp để kiểm tra ngữ cảnh. Không cần khởi động lại Backend mỗi lần thêm/sửa sản phẩm. Các lượt Groq kiểm tra không được lưu thành tin nhắn Inbox; chưa thay thế nghiệm thu UI hay bộ A/B đầy đủ.

## Giới hạn cần nói khi báo cáo

Đây là bản demo RAG trên KB + Product/giá/kho snapshot, chưa nghiệm thu trình duyệt đầy đủ hoặc bộ đánh giá A/B 20 tình huống. Embedding chạy local sau khi tải model; Groq vẫn cần kết nối mạng. So sánh vector trong backend tuyến tính theo số mục của Shop, chưa có chỉ mục vector chuyên dụng. Giá/kho tại lúc đọc có thể thay đổi khi khách đặt; Order vẫn là nơi trừ kho và quyết định tạo đơn.
