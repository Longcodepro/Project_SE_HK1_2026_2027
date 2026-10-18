# 09 · Đối chiếu các sơ đồ

Chứng minh các sơ đồ ăn khớp nhau. Thứ tự suy ra: `01-bfd` → `02-use_case` → `03-erd` → `04-class` → `05-sequence`, `06-state`, `07-activity`, `08-collaboration`. `10-giao-dien` chỉ có folder, chưa làm.

**Kiểm tự động:** `python3 docs/09-doi-chieu/check_consistency.py` (chạy lại sau mỗi lần sửa sơ đồ). Script kiểm:
- mọi thông điệp sequence và collaboration tới một lớp phải là hàm có thật ở sơ đồ lớp;
- mọi route trong sequence phải có trong bảng route của `Class-02-DichVu.md`;
- mọi token `Lớp.hàm` hay `Lớp.thuộc tính` trong tài liệu phải có thật;
- **ngược lại:** mọi hàm khai báo ở `Class-02-DichVu.md` và `Class-03-GiaoDien.md` phải được ít nhất một sequence hoặc collaboration gọi tới (phát hiện hàm "mồ côi", tức còn thiếu sơ đồ);
- 77 UC đều có trong BFD và trong ít nhất một sequence, 80 chức năng lá BFD (70 gốc + 10 bổ sung: 1.6, 6.7, 6.8, 7.3, 8.11, 8.12, 10.11, 10.12, 11.5, 12.5);
- tập trạng thái đơn ở state, enum và ERD trùng nhau.

Kết quả lần chạy gần nhất: **OK**, xem số liệu khi chạy `check_consistency.py` (77 UC, 72 route).

**Kiểm cú pháp Mermaid:** `09-doi-chieu/check_mermaid.mjs` phân tích mọi khối ```mermaid trong `docs/` (cần cài một lần `npm i mermaid@10.9.1 jsdom@24`, chạy `node check_mermaid.mjs <đường dẫn docs>`). Lần gần nhất: 80 sơ đồ, 0 lỗi. Lưu ý khi sửa: dấu chấm phẩy `;` trong chú thích sequence làm hỏng sơ đồ, dùng dấu phẩy.

**File hình `.drawio`:** mỗi file `.md` ở `03` đến `08` có một file `.drawio` cùng tên (mỗi sơ đồ Mermaid là một trang), cùng `01-bfd/BFD-BrewLite.drawio` (80 chức năng lá) và `02-use_case/` (1 trang tổng quan, 14 trang PR, 77 UC). Tất cả dựng bằng `09-doi-chieu/md2drawio.mjs` (`node md2drawio.mjs <đường dẫn docs>`, cần cùng gói npm như trên). Bố cục tự động nên chỉ cần kéo cho đẹp, **nội dung luôn lấy từ file `.md`**; sửa `.md` rồi chạy lại sẽ ghi đè mọi chỉnh sửa bố cục. Hình gốc của nhóm cất ở `09-doi-chieu/hinh-goc/`.

**Đề xuất cho file dùng chung:** `docs/de-xuat/schema.prisma.de-xuat` (24 bảng, 20 enum, đã qua `prisma validate`, dựng bằng `gen_prisma.py`) và `docs/de-xuat/API-CONTRACT-de-xuat.md` (72 route, 56 DTO, dựng bằng `gen_contract.py`). Chưa thay `backend/prisma/schema.prisma` và `docs/API-CONTRACT.md` vì cần Long và Tài đồng ý, và code hiện có (đăng nhập bằng email, id chuỗi) sẽ phải viết lại theo thiết kế mới.

**Chưa kiểm tự động được (cần mắt người):** thứ tự thông điệp giữa sequence và collaboration (đã đối chiếu tay), nội dung từng bước ở activity, logic của quy tắc BR. Đã đối chiếu tự động riêng (không nằm trong script): cột của ERD, RDM và sơ đồ lớp miền trùng nhau, 20 enum trùng giữa ERD và sơ đồ lớp, mọi mã BR được định nghĩa và dẫn chiếu.

## 1. Danh mục sơ đồ

| Loại | Số | File |
|---|---|---|
| BFD | 1 | `BFD-BrewLite` |
| Use case (danh mục, đặc tả, mẫu hóa đơn) | 3 | `UseCase-BrewLite`, `DacTa-UseCase`, `MauHoaDon` |
| ERD và RDM | 2 | `ERD-01-BrewLite.md`, `RDM-01-BrewLite.md` |
| Lớp | 4 | `Class-01-MienDuLieu.md` miền dữ liệu, `Class-02-DichVu.md` backend và bảng route, `Class-03-GiaoDien.md` frontend, `Class-04-DTO.md` DTO |
| Sequence | 16 | `S01` Tài khoản (gồm OTP), `S02` Xem menu, `S03` Giỏ hàng, `S04` Đặt hàng, `S05` Thanh toán, `S06` Theo dõi đơn, `S07` Hủy đơn, `S08` Phản hồi dịch vụ, `S09` Xử lý đơn, `S10` Quản lý sản phẩm, `S11` Quản trị CRUD, `S12` Thống kê, `S13` Phân quyền, `S14` Gửi thông báo, `S15` Ví hoàn tiền và rút tiền, `S16` Xử lý món không làm được |
| State | 7 | `ST01` Đơn hàng, `ST02` Thanh toán, `ST03` Sản phẩm/danh mục/topping, `ST04` Tài khoản và phiên, `ST05` Khuyến mãi, `ST06` Giỏ hàng, `ST07` Ví hoàn tiền và yêu cầu rút tiền |
| Activity | 11 | `A01` Đặt hàng–thanh toán, `A02` Xử lý đơn, `A03` Hủy đơn và phản hồi dịch vụ, `A04` Tài khoản, `A05` Giỏ hàng, `A06` Theo dõi đơn, `A07` Quản lý sản phẩm, `A08` Danh mục–topping–khuyến mãi, `A09` Người dùng, `A10` Thống kê, `A11` Ví hoàn tiền và rút tiền |
| Collaboration | 15 | `C01` Đặt hàng, `C02` Thanh toán, `C03` Phản hồi dịch vụ, `C04` Tài khoản, `C05` Xem menu, `C06` Giỏ hàng, `C07` Theo dõi đơn, `C08` Hủy đơn, `C09` Xử lý đơn, `C10` Quản lý sản phẩm, `C11` Quản trị CRUD, `C12` Thống kê, `C13` Gửi thông báo, `C14` Ví hoàn tiền và rút tiền, `C15` Xử lý món không làm được |
| Giao diện | 0 | `10-giao-dien` (folder trống, theo yêu cầu) |

Lưu ý đánh số: Collaboration C01–C03 giữ tên theo thứ tự làm trước, C04–C12 theo thứ tự sequence. Bảng dưới đây tra theo mã trong cột này.

## 2. Từ vựng thống nhất

| Khái niệm | Tên dùng ở mọi sơ đồ |
|---|---|
| Tác nhân | Khách vãng lai (không JWT), Khách hàng (`CUSTOMER`, kế thừa Khách vãng lai), Nhân viên (`STAFF`), Quản lý (`MANAGER`, kế thừa Nhân viên), Cổng thanh toán (mock) |
| Trạng thái đơn | `PENDING`, `PAID`, `PAYMENT_FAILED`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED` (7 trạng thái) |
| Phản hồi dịch vụ | `ServiceFeedback`: 1 đến 5 sao + nhận xét, mỗi đơn `COMPLETED` một phản hồi (UC28, UC37) |
| Trạng thái sản phẩm | `Product.status`: `ON_SALE` (còn bán), `SOLD_OUT` (hết bán: vẫn hiện nhưng mờ, không đặt được, UC39), `LOCKED` (khóa bán: ẩn khỏi menu, UC47) |
| Hoàn tiền | `Refund.reason` là `CANCEL` (hủy đơn đã trả tiền, hoàn đủ) hoặc `MISSING_ITEM` (món thiếu, hoàn theo món). Luôn qua `RefundsService.refund` và **cộng vào ví của khách**, không trả về cổng thanh toán |
| Ví hoàn tiền | `User.walletBalance`, chỉ nhận tiền hoàn, không thanh toán đơn. Rút tiền bằng yêu cầu, quản lý chuyển thủ công (UC71–UC73) |
| Giỏ hàng | Chỉ ở client (`CartStore`), không có bảng. Thêm vào giỏ cần đăng nhập |
| Mã lỗi | 400 sai định dạng, 401 chưa đăng nhập hoặc sai thông tin, 403 bị khóa hoặc thiếu quyền, 404 không có, 409 trùng hoặc sai trạng thái, 422 vi phạm nghiệp vụ |
| Tên hàm và route | `04-class/Class-02-DichVu.md` (backend), `Class-03-GiaoDien.md` (frontend) |
| Dữ liệu vào ra API | `04-class/Class-04-DTO.md` |
| Quy tắc nghiệp vụ | BR01–BR53 ở `02-use_case/DacTa-UseCase.md` |

## 3. Ma trận use case → sơ đồ → dữ liệu

Tên hàm, route của từng UC: xem bảng route ở `Class-02-DichVu.md` (không nhắc lại ở đây để khỏi lệch). Mã `S`, `A`, `C`, `ST` theo mục 1.

Ghi chú: cột State là **chủ đề** của sơ đồ trạng thái có liên quan, không phải mọi UC trong hàng đều được nhắc đích danh trong file State đó.

| UC | BFD | Sequence | Activity | Collaboration | State | Bảng dữ liệu chính |
|---|---|---|---|---|---|---|
| UC01, UC02 | 1.1, 1.2 | S01 | A04 | C04 | ST04 | `user`, `otp_code` |
| UC03 | 1.3 | S01 | A04 | C04 | ST04 | `revoked_token` |
| UC04, UC05, UC06 | 1.4, 1.5 | S01 | A04 | C04 | | `user` |
| UC07, UC08, UC09 | 2.1, 2.2, 2.3 | S02 | A01 | C05 | | `product`, `category` |
| UC10 | 2.4, 2.8 | S02 | A01 | C05 | ST03 | `product`, `product_size`, `product_topping`, `topping` |
| UC11, UC12, UC13, UC14 | 3.1, 2.5, 2.6, 2.7 | S03 | A01, A05 | C06 | ST06 | không (client) |
| UC15, UC16, UC17 | 3.2, 3.3, 3.4 | S03 | A05 | C06 | ST06 | không (client) |
| UC18 | 4.1, 4.2 | S04, S14 | A01 | C01, C13 | ST01, ST06 | `order`, `order_item`, `order_item_topping`, `notification`, `product` (trừ số ly) |
| UC19 | 4.3 | S04 | A01 | C01 | ST05 | `promotion`, `promotion_usage` |
| UC20 | 4.4, 6.1 | S04 | A01 | C01 | | `order` |
| UC21 | 5.1 | S05 | A01 | C02 | | không (client) |
| UC22 | 5.2, 5.3, 7.1 | S05, S14 | A01 | C02, C13 | ST01, ST02 | `payment`, `order`, `user`, `notification`, `promotion` (mã thưởng), `reward_rule`, `loyalty_setting` |
| UC23 | 5.4 | S05 | A01 | C02 | ST01, ST02 | `payment`, `order` |
| UC24, UC25, UC26 | 6.2, 6.3, 6.6 | S06 | A06 | C07 | ST01 | `order`, `order_item`, `payment`, `refund` (hóa đơn UC25) |
| UC27 | 6.4 | S07 | A03 | C08 | ST01, ST02 | `order`, `refund`, `wallet_transaction`, `promotion_usage`, `product` (trả số ly), `user` (thu hồi điểm) |
| UC28 | 6.5 | S08 | A03 | C03 | | `service_feedback` |
| UC29 | 7.2 | S06 | A06 | C07 | | `user` |
| UC30, UC31 | 10.1, 10.2 | S09 | A02 | C09 | | `order` |
| UC32, UC33 | 10.3, 10.6 | S09 | A02 | C09 | ST02 | `order`, `payment`, `refund`, `service_feedback`, `item_issue` |
| UC34 | 10.4 | S09, S14 | A02 | C09, C13 | ST01 | `order`, `notification` |
| UC35 | 10.9, 10.10 | S09, S14 | A02 | C09, C13 | ST01 | `order`, `notification` |
| UC36 | 10.5 | S07 | A03 | C08 | ST01, ST02 | `order` (người hủy, lý do), `refund`, `wallet_transaction`, `promotion_usage`, `product` (trả số ly), `user` (thu hồi điểm) |
| UC37 | 10.7 | S08 | A03 | C03 | | `service_feedback` |
| UC38 | 10.8 | S07, S15 | A03 | C08, C14 | ST02, ST07 | `refund`, `payment`, `wallet_transaction` |
| UC39 | 8.10 | S10 | A07 | C10 | ST03 | `product` |
| UC76, UC77 | 8.11, 8.12 (bổ sung) | S10 | A07 | C10 | ST03 | `product` (dailyQuota, stockRemaining, stockDate, stockVersion) |
| UC40–UC46 | 8.1–8.3, 8.6–8.9 | S10 | A07 | C10 | | `product`, `product_size`, `product_topping` |
| UC47 | 8.4 | S10 | A07 | C10 | ST03 | `product` |
| UC48–UC51 | 8.5 | S11 | A08 | C11 | ST03 | `category` |
| UC52–UC55 | 9.1–9.4 | S11 | A08 | C11 | ST03 | `topping` |
| UC56–UC59 | 11.1–11.4 | S11 | A08 | C11 | ST05 | `promotion` |
| UC60, UC61, UC63 | 12.1, 12.2, 12.4 | S11 | A09 | C11 | | `user` |
| UC62 | 12.3 | S11, S13 | A09 | C11 | ST04 | `user` |
| UC64–UC67 | 13.1–13.4 | S12 | A10 | C12 | | `order`, `order_item`, `order_item_topping` |
| UC68 | 1.6 (bổ sung) | S01 | A04 | C04 | | `user`, `otp_code` |
| UC69 | 11.5 (bổ sung) | S11 | A08 | C11 | | `loyalty_setting`, `reward_rule` |
| UC70 | 7.3 (bổ sung) | S06, S04 | A06, A01 | C07, C01 | ST05 | `promotion` |
| UC71 | 6.7 (bổ sung) | S15 | A11 | C14 | ST07 | `user` (ví), `wallet_transaction` |
| UC72 | 6.8 (bổ sung) | S15 | A11 | C14 | ST07 | `withdrawal_request`, `wallet_transaction` |
| UC73 | 10.11 (bổ sung) | S15 | A11 | C14 | ST07 | `withdrawal_request`, `wallet_transaction` |
| UC74 | 10.12 (bổ sung) | S16 | A03 | C15 | ST02 | `item_issue`, `refund`, `wallet_transaction` |
| UC75 | 12.5 (bổ sung) | S11 | A09 | C11 | ST04 | `user` |
| Mọi route có JWT | (xuyên suốt) | S13 | | | ST04 | `user` |

## 4. Trạng thái đơn xuất hiện ở đâu

| Trạng thái | ERD / Class | State | Sequence |
|---|---|---|---|
| `PENDING` | enum `OrderStatus` | ST01 | S04, S05, S07 |
| `PAID` | có | ST01 | S05, S07, S09, S16 |
| `PAYMENT_FAILED` | có | ST01 | S05, S07 |
| `PREPARING` | có | ST01 | S09, S07 (chặn hủy), S16 |
| `READY` | có | ST01 | S06, S09, S16 |
| `COMPLETED` | có | ST01 | S09, S08 (cho phép gửi phản hồi) |
| `CANCELLED` | có | ST01 | S07 |

## 5. Bảng ↔ lớp ↔ nơi ghi

| Bảng | Lớp miền | Ghi bởi |
|---|---|---|
| `user` | User | `UsersService`, `AuthService`, `LoyaltyService` |
| `otp_code` | OtpCode | `OtpService` |
| `notification` | Notification | `NotificationService` |
| `revoked_token` | RevokedToken | `TokenRevocationService` |
| `category` | Category | `CategoriesService` |
| `product`, `product_size`, `product_topping` | Product, ProductSize, ProductTopping | `ProductsService` |
| `topping` | Topping | `ToppingsService` |
| `promotion` | Promotion | `PromotionsService` (mã chung do quản lý tạo; mã riêng do `PromotionsService.issueReward` khi `LoyaltyService` cấp) |
| `promotion_usage` | PromotionUsage | `PromotionsService` (`recordUsage`, `releaseUsage`) |
| `reward_rule`, `loyalty_setting` | RewardRule, LoyaltySetting | `LoyaltyService` |
| `order`, `order_item`, `order_item_topping` | Order, OrderItem, OrderItemTopping | `OrdersService` |
| `payment` | Payment | `PaymentsService` |
| `refund` | Refund | `RefundsService` |
| `wallet_transaction`, `withdrawal_request` | WalletTransaction, WithdrawalRequest | `WalletService` |
| `item_issue` | ItemIssue | `OrdersService` (`handleMissingItem`) |
| `service_feedback` | ServiceFeedback | `FeedbackService` |

## 6. Quyết định mặc định đã chốt

Các điểm BFD và hình use case không nói rõ. Tất cả sơ đồ đang dùng phương án ở cột "Đang dùng", **không cần ai duyệt**. Muốn đổi chỗ nào thì nói "đổi G.. thành .." và sửa theo cột "Nếu đổi".

| Mã | Vấn đề | Đang dùng | Nếu đổi thì ảnh hưởng |
|---|---|---|---|
| G01 | Quản lý có kế thừa Nhân viên không | Có (mũi tên Quản lý → Nhân viên trong hình) | Nếu không, Quản lý không làm được UC30–UC39 |
| G02 | Hủy đơn được ở trạng thái nào | `PENDING`, `PAYMENT_FAILED`, `PAID` | Đổi BR13, ST01, S07 |
| G08 | Phương thức thanh toán | `EWALLET`, `CARD`, `TRANSFER` (xem G43) | Đổi enum `PaymentMethod` |
| G09 | Size và mức đá/đường | Size `S`, `M`, `L`; mức 0–100 bước 25 | Đổi enum `SizeCode` và BR04 |
| G10 | Điểm thưởng | Tích điểm theo tiền: mỗi 10.000đ được 10 điểm trên số tiền đã trả; quản lý chỉnh được (UC69). Điểm không bị trừ khi hủy, không có đổi điểm (BR11, BR23, BR40) | Đổi BR11, BR23, BR40 |
| G11 | Báo cho khách biết trạng thái đơn | Polling 10 giây, không push | Thêm push thì cần WebSocket hoặc SSE |
| G12 | Giỏ hàng lưu ở đâu | Zustand `persist` vào `localStorage`, **mỗi tài khoản một giỏ** (khóa `cart:<userId>`). Đăng xuất không mất giỏ | Bỏ `persist` thì mất giỏ khi tải lại trang (ST06) |
| G13 | Đổi số điện thoại hoặc email | **Đã chốt:** số điện thoại **không** đổi được sau đăng ký. Email thêm, đổi, xóa được | Không đổi (đã chốt) |
| G14 | Cổng mock quyết định thất bại thế nào | Chưa chốt (đề xuất: ngẫu nhiên hoặc theo giá trị thử nghiệm). Chốt khi code `PaymentGateway.charge` (cổng chỉ còn thu tiền, không còn hoàn tiền) | Chốt khi code `PaymentGateway` |
| G15 | Định dạng mã | `orderCode` = `BL`+`yyMMdd`+4 số; `pickupCode` 6 số | Đổi BR25, BR12 |
| G16 | UC20 nghĩa là gì | Bước xem tóm tắt trước khi đặt và hiện mã đơn sau khi tạo (gộp BFD 4.4 và 6.1) | Tách UC mới nếu nhóm muốn |
| G17 | UC35 | Gộp tra cứu theo mã (BFD 10.9) và xác nhận giao (BFD 10.10) | Tách UC mới nếu muốn |
| G18 | Số hiệu UC | UC01–UC67 theo thứ tự BFD (hình gốc chưa đánh mã); UC68 đến UC77 là chức năng bổ sung ngoài BFD gốc | Đổi mã thì sửa mọi file |
| G19 | Bật lại mã khuyến mãi đã vô hiệu hóa | Được, qua `PromotionsService.update` đặt `isActive = true` (ST05) | Không cho thì bỏ cạnh `Disabled → NotStarted` |
| G20 | Số điện thoại là tên đăng nhập | Đăng nhập bằng số điện thoại và mật khẩu. Số hợp lệ: 10 chữ số, bắt đầu bằng 0 | Cho đăng nhập bằng email nữa thì thêm nhánh ở `AuthService.login` |
| G21 | OTP mock hoạt động ra sao | Mã 6 số, hạn 5 phút, sai quá 5 lần mất hiệu lực, gửi lại cách ≥ 60 giây. `SmsGateway` chỉ ghi log. Demo có thể dùng mã cố định `123456` | Đổi thông số ở BR27 |
| G22 | Đăng ký xong chưa nhập OTP | Tài khoản ở trạng thái chờ xác thực, chưa đăng nhập được, nhập OTP sau qua màn đăng nhập | Muốn xóa tài khoản chưa xác thực sau một thời gian thì cần tác vụ dọn dẹp |
| G23 | Thông báo gửi ở mốc nào | 4 mốc đơn hàng: tạo đơn, thanh toán thành công (SMS ngắn + email hóa đơn), nước xong kèm mã nhận hàng, nhận xong (cảm ơn); cộng thêm thông báo cấp mã thưởng và kết quả yêu cầu rút tiền. Chưa gửi khi hủy đơn, hoàn tiền | Thêm mốc thì thêm giá trị vào `NotificationEvent` và gọi `NotificationService.notifyOrderEvent` ở bước tương ứng |
| G24 | Email thật gửi bằng gì | SMTP theo cấu hình môi trường; chỉ gửi khi khách có email; lỗi chỉ ghi `FAILED` | Chọn nhà cung cấp cụ thể khi code `MailGateway` |
| G25 | Khách chưa đăng nhập bấm thêm giỏ | Món vừa chọn được nhớ tạm (`sessionStorage`), chuyển sang đăng nhập hoặc đăng ký, xong tự thêm vào giỏ (BR29) | Không nhớ tạm thì khách phải chọn lại món sau khi đăng nhập |
| G26 | Thời gian sống của JWT | **7 ngày**, không có refresh token. Hết hạn thì đăng nhập lại (BR30) | Đổi thời hạn ở `AuthService.issueToken`; muốn dùng lâu hơn mà an toàn thì thêm refresh token |
| G27 | Đăng xuất có thu hồi JWT không | **Có**: máy chủ ghi `jti` vào bảng `revoked_token`, thẻ cũ bị từ chối 401 (BR19). Thu hồi từng thẻ, không đăng xuất mọi thiết bị | Muốn đăng xuất mọi thiết bị một lần thì thêm cột đánh số phiên bản thẻ cho `user` |
| G28 | Quên mật khẩu | Bổ sung UC68 (ngoài BFD gốc). Xin mã bằng số điện thoại, OTP mock có mục đích `RESET_PASSWORD`, nhập mã và mật khẩu mới. Trả lời bước xin mã luôn giống nhau. Đặt lại xong khách tự đăng nhập, JWT cũ không bị thu hồi | Muốn thu hồi mọi phiên cũ sau khi đặt lại thì cần thêm cột đánh số phiên bản thẻ cho `user` (cùng với G27) |
| G29 | Gợi ý khi gõ tìm kiếm | Gợi ý tính **trên client** từ danh sách món đã tải, khớp kiểu chứa từ khóa, tối đa 5, không gọi máy chủ. Không bỏ dấu tiếng Việt (BR32) | Muốn gõ không dấu vẫn ra thì bỏ dấu cả tên món lẫn từ khóa ngay trên client, không cần đổi dữ liệu |
| G30 | Ai đổi trạng thái món | Nhân viên và Quản lý đặt hết bán / còn bán (UC39, tức BFD 8.10). Chỉ Quản lý khóa bán / mở lại (UC47, tức BFD 8.4). Mở lại món khóa bán thì về còn bán (BR33) | Cho nhân viên cũng khóa bán được thì mở rộng quyền của `PATCH /admin/products/:id/lock` |
| G31 | Dung tích (ml) của size | Tùy chọn, số nguyên 1 đến 2000, nhập ở UC42, hiện kèm tên size ở trang chi tiết, lưu ảnh chụp vào dòng đơn (BR34). Chưa bắt buộc | Muốn bắt buộc thì đổi cột `volumeMl` thành không null |
| G32 | Nóng / lạnh | Quản lý đặt cho từng món: cho nóng, cho lạnh, hoặc cả hai kèm mặc định (UC44). Món chỉ một nhiệt độ thì ô chọn **vẫn hiện nhưng bị khóa** ở nhiệt độ đó. Chọn nóng thì đá về 0 và bị khóa. Giá không đổi theo nhiệt độ (BR35) | Muốn nóng và lạnh khác giá thì thêm giá riêng theo nhiệt độ cho từng size |
| G33 | Ghi chú cho món | Tùy chọn, **tối đa 20 từ** (và không quá 200 ký tự), văn bản thuần, hiện cho nhân viên ở chi tiết đơn và in dưới dòng món trên hóa đơn. Khác ghi chú thì không gộp dòng trong giỏ (BR36) | Đổi độ dài ở BR36 |
| G34 | Giới hạn topping | Quản lý đặt cho **từng món** hai số: số phần tối đa của mỗi loại topping và tổng số phần tối đa (0 đến 10). Khách chọn số phần cho từng topping, giá tính theo số phần (BR37). Mặc định gợi ý: mỗi loại 1, tổng 3 | Muốn mỗi topping có giới hạn riêng thì thêm cột giới hạn vào bảng `product_topping` |
| G35 | Hóa đơn | Dựng từ đơn, không có bảng riêng. Xem trong app (UC25). Thanh toán thành công thì gửi email hóa đơn nếu khách có email; SMS chỉ một dòng ngắn gồm mã đơn và mã giao dịch. Email là bản chụp lúc thanh toán, bản trong app luôn đúng với đơn hiện tại (có hoàn tiền thì hiện thêm). Mã giao dịch lấy từ `Payment.gatewayRef`. Bố cục ở `MauHoaDon.md` (BR38) | Muốn lưu hóa đơn thành file PDF hoặc tải về thì cần thêm chức năng |
| G36 | Hai loại mã khuyến mãi | `FIXED` giảm thẳng một số tiền (không vượt tạm tính). `PERCENT` giảm theo phần trăm và **bắt buộc có mức giảm tối đa**. Mã đã dùng ghi lên hóa đơn kèm mô tả mã và số tiền giảm thực tế (BR07, BR38). Giới hạn lượt dùng xem G38 | Xem G38 |
| G37 | Số mã trong một đơn | **Một mã** mỗi đơn, không cộng dồn nhiều mã. Áp mã khác thì thay mã cũ (BR39) | Cho dùng nhiều mã thì phải quy định thứ tự áp và mã sau tính trên số tiền còn lại sau mã trước |
| G38 | Hai loại mã và giới hạn lượt | Mã chung (ai dùng cũng được, đặt tổng lượt tối đa hoặc không giới hạn, và số lần mỗi khách được dùng, mặc định 1). Mã riêng (gắn một tài khoản, dùng một lần, có hạn). Quản lý chỉ tạo mã chung, mã riêng do hệ thống cấp (BR39) | Cho quản lý tặng mã riêng tay cho một khách thì thêm chức năng cấp mã |
| G39 | Thưởng mã theo mốc | Cứ mỗi N điểm hoặc N ly khách đạt thêm, hệ thống tự cấp một mã riêng theo quy tắc quản lý đặt. **Không trừ điểm**, không có chức năng đổi điểm. Gợi ý mặc định: mỗi 10 ly tặng 1 ly, mỗi 500 điểm tặng 20.000đ, hạn 30 ngày (BR40) | Muốn khách tự đổi điểm lấy mã thì thêm chức năng đổi điểm và xử lý trả điểm khi hủy đơn |
| G40 | Mã "tặng 1 ly" | Quản lý gắn cho mã (hoặc quy tắc thưởng) một **danh sách món được tặng**. Khách chọn **một ly trong đơn** thuộc danh sách, giảm đúng giá ly đó, có thể đặt mức tối đa. Mỗi mã tặng một ly (BR07) | Muốn tặng nhiều ly một lần thì thêm số ly tặng cho mã |
| G41 | Lượt dùng mã và hủy đơn | Lượt dùng tính ngay khi **tạo đơn**, trả lại khi đơn bị hủy. Đơn thanh toán hỏng vẫn giữ lượt vì khách còn thử lại được (BR39) | Muốn chỉ tính lượt khi thanh toán thành công thì phải xử lý nhiều đơn cùng giữ một mã |
| G42 | Tích ly | Số ly = tổng số ly của các đơn thanh toán thành công, không bị trừ khi hủy đơn hay hoàn tiền món không làm được (BR40, BR23) | Muốn trừ ly khi hủy thì sửa `LoyaltyService.award` và các hàm hoàn tiền |
| G43 | Phương thức thanh toán | **Tạm thời, nhóm sẽ xem lại.** Ví giả lập đơn giản (chưa có số dư ví), thẻ (form 4 ô, không lưu số thẻ), chuyển khoản (mã tham chiếu, hạn 10 phút). Hoàn tiền không qua cổng mà cộng vào ví của khách (BR41, BR43) | Muốn ví có số dư thật thì thêm số dư, nạp ví, và hoàn tiền cộng lại vào ví |
| G44 | Mã nhận hàng dạng số và QR | Mã 6 số, QR chứa đúng 6 số đó. Hiện cả hai trong app và email; SMS chỉ gửi số. Hiện nhân viên chỉ nhập số; quét QR bằng camera ở tài khoản nhân viên là chức năng làm sau (BR42) | Muốn QR chứa đường dẫn thì quét xong tự mở đơn, cần thêm route |
| G45 | Bỏ luồng báo thiếu hàng, thay bằng phản hồi dịch vụ | Không có luồng khách tự báo thiếu qua app. Sau khi đơn `COMPLETED` khách có thể gửi phản hồi 1 đến 5 sao + nhận xét (tối đa 50 từ), mỗi đơn một lần, không sửa được; nhân viên và quản lý xem được. Không đổi trạng thái đơn. Xử lý món hết làm được xem G49, khách nhận thiếu món xem G50 (BR14, BR15) | Cho khách sửa phản hồi hoặc giới hạn thời gian gửi (ví dụ 7 ngày) thì thêm quy tắc |
| G46 | Hủy đơn của nhân viên | Ghi nhân viên đã hủy và lý do (bắt buộc, từ 5 đến 200 ký tự). Khách tự hủy thì lý do tùy chọn. Quản lý xem lại ở danh sách đơn `CANCELLED` và chi tiết đơn (BR13) | Muốn quản lý phải duyệt trước khi nhân viên hủy đơn đã trả tiền thì thêm bước duyệt |
| G47 | Hoàn tiền vào ví | Mọi hoàn tiền cộng vào ví trên web của khách, không trả về cổng thanh toán. Ví chỉ nhận tiền hoàn, không thanh toán đơn, không nạp thêm (BR43) | Cho dùng ví để thanh toán đơn thì thêm phương thức thanh toán ví và xử lý đơn hủy |
| G48 | Rút tiền từ ví | Khách gửi yêu cầu (tối thiểu 10.000đ, tối đa bằng số dư) kèm thông tin nhận; ví bị trừ ngay khi gửi; quản lý chuyển thủ công rồi hoàn tất kèm mã giao dịch, hoặc từ chối kèm lý do thì trả lại ví. Báo khách bằng SMS và email nếu có (BR44) | Muốn trừ ví khi quản lý duyệt thay vì lúc gửi thì phải chặn gửi nhiều yêu cầu cùng lúc |
| G49 | Xử lý món không làm được | Món hết làm được (hết nguyên liệu) thì nhân viên ghi nhận trước khi giao: hoàn tiền món đó vào ví (đơn giá ly × số ly, không chia lại khuyến mãi) hoặc đổi món khác (chỉ ghi nhận). Lý do bắt buộc, quản lý xem lại. Chỉ khi đơn `PAID`, `PREPARING`, `READY` (BR45). Khách không tự báo thiếu qua app | Muốn cho xử lý cả sau khi giao thì thêm trạng thái `COMPLETED` vào điều kiện |
| G50 | Khách nhận thiếu món | Khách báo tại quầy lúc nhận, nhân viên xử lý tại chỗ. Hệ thống không ghi nhận và không hoàn tiền (BR15). Khác với món hết làm được trước khi giao (G49) | Muốn ghi nhận thì thêm lại luồng báo thiếu sau khi giao |
| G51 | Tài khoản nhân viên | Quản lý tạo tài khoản nhân viên (số điện thoại, họ tên, mật khẩu khởi tạo), không cần OTP; tài khoản quản lý đầu tiên tạo sẵn khi triển khai (BR46) | Muốn nhân viên tự đăng ký rồi chờ duyệt thì thêm trạng thái chờ duyệt |
| G52 | Danh sách và xóa dữ liệu | Mọi danh sách quản trị phân trang 20 dòng; không xóa hẳn dữ liệu nào, chỉ khóa, ẩn, vô hiệu hóa (BR47) | Muốn xóa thật thì phải xử lý đơn cũ đang tham chiếu |
| G53 | Sửa mã khuyến mãi đã dùng | Không đổi mã, cách giảm, giá trị khi đã có lượt dùng; chỉ đổi hạn, lượt, đơn tối thiểu, bật tắt (BR48) | Cho sửa tự do thì đơn cũ vẫn đúng vì đã lưu ảnh chụp |
| G54 | Thống kê mặc định | Khoảng thời gian mặc định 30 ngày gần nhất; top 10 (tối đa 50); doanh thu kèm tổng, số đơn, giá trị đơn trung bình (UC64–UC67) | Đổi mặc định ở đặc tả |
| G55 | Tồn kho | Không quản lý nguyên liệu. Quản lý ước tính số ly tối đa của từng món mỗi ngày (UC76), hoặc dùng lại số hôm qua (UC77). Ngày mới mà chưa nhập thì số ly còn lại coi như 0, món hết ly hiện mờ như hết bán (BR49) | Muốn tự chuyển sang số hôm qua mỗi sáng thì UC77 chạy tự động; muốn quản lý theo nguyên liệu thì thêm bảng nguyên liệu và công thức |
| G56 | Ly giữ chỗ | Đơn `PENDING` hoặc `PAYMENT_FAILED` giữ ly tới khi thanh toán hoặc bị hủy, không tự hết hạn. Hủy đơn trả lại số ly chỉ khi đơn tạo hôm nay (BR50) | Thêm hạn 15 phút tự hủy đơn chưa trả tiền nếu quán đông |
| G57 | Nhập lại giữa ngày | UC76 thay hẳn số còn lại bằng số mới, không cộng thêm. Đơn đã đặt trước đó không bị ảnh hưởng (BR49) | Đổi thành cộng thêm nếu quản lý quen nhập phần bổ sung |
| G58 | Dữ liệu mẫu và ngày mới | `seed` đặt `dailyQuota` 50 và `stockDate` là hôm nay cho mỗi món. Sang ngày khác phải nhập lại bằng UC76 hoặc bấm UC77 (BR49) | Cho seed tự chạy hằng ngày nếu muốn demo không cần thao tác |
| G59 | Hủy đơn đã trả tiền | Trừ lại điểm và số ly của đơn (`Order.pointsAwarded`), không thu hồi mã thưởng đã cấp (BR51) | Thu hồi cả mã thưởng nếu muốn chặt hơn |
| G60 | Nhân viên xem danh sách món | `GET /admin/products` cho `STAFF` (chỉ xem) để làm UC39, các thao tác sửa vẫn chỉ `MANAGER` | Tách một route riêng cho nhân viên nếu muốn che `dailyQuota` |
| G61 | Giới hạn mỗi dòng | 20 ly mỗi dòng (BR52) | Đổi con số ở BR52 |

## 7. Chỗ hình use case chưa vẽ nhưng sơ đồ khác cần

**Đã xử lý cả D1–D13** khi dựng lại các file `.drawio` (BFD 80 chức năng lá, use case 77 UC chia 14 trang PR, hai tác nhân phụ mới, include từ UC27 và UC36 tới UC38, UC39 ở PR8). Bảng dưới giữ lại để biết hình gốc của nhóm khác tài liệu ở đâu; hình gốc cất ở `09-doi-chieu/hinh-goc/`. Hình dựng bằng `md2drawio.mjs` (xem cách chạy ở đầu file đó) nên chỉ chỉnh bố cục, đừng đổi nội dung; muốn đổi nội dung thì sửa file `.md` rồi dựng lại.

| Mã | Điểm lệch | Gợi ý |
|---|---|---|
| D1 | Hoàn tiền (UC38) chạy khi hủy đơn đã trả tiền (UC27, UC36); hình gốc vẽ UC37 include UC38 (từ luồng thiếu hàng cũ) | Vẽ «include» từ UC27 và UC36 tới UC38 và bỏ nối từ UC37 |
| D2 | UC39 Khóa/mở bán nằm ở trang Nhân viên, nhưng PR8 (phân rã Quản lý sản phẩm) không có | Quản lý có UC39 nhờ kế thừa. Có thể thêm vào PR8 cho đủ |
| D3 | Tổng quan vẽ Thanh toán include Chọn phương thức, còn PR6 vẽ hai UC độc lập | Chọn một cách. Tài liệu theo tổng quan: UC22 include UC21 |
| D4 | UC28 (khách gửi phản hồi 5 sao) và UC37 (nhân viên xem phản hồi) thay cho "Phản hồi đơn thiếu hàng" và "Xử lý đơn thiếu hàng" trên hình; tên và nội dung hai UC trên hình gốc cần đổi | Đổi tên hai UC trên hình use case và nối UC28 với UC37 qua ghi chú. Nhóm đã bỏ luồng báo thiếu hàng |
| D5 | "Xem chi tiết đơn hàng" xuất hiện ở PR7 (khách) và PR11 (nhân viên) cùng tên | Tài liệu đặt là UC25 và UC32 |
| D6 | BFD 3.5, 4.1, 5.3, 7.1, 10.9 không có use case riêng | Tài liệu coi là bước hệ thống trong UC khác (`01-bfd/BFD-BrewLite.md`) |
| D7 | Hình use case chưa có xác thực OTP, thông báo, cũng như hai tác nhân phụ mới (Cổng SMS mock, Dịch vụ email) | Có thể thêm hai tác nhân phụ nối với UC01, UC18, UC22, UC34, UC35. Không bắt buộc |
| D8 | Hình tổng quan, PR3 và PR4 vẽ **Khách vãng lai** nối với Thêm món vào giỏ và Chỉnh sửa giỏ. Theo yêu cầu mới, hai UC này phải cần đăng nhập | Nối UC11 và UC15–UC17 từ **Khách hàng** thay vì Khách vãng lai. UC12–UC14 (chọn tùy chọn) vẫn nối từ Khách vãng lai |
| D9 | Hình use case chưa có **Quên mật khẩu** (UC68) và chưa có BFD 1.6 | Thêm UC68 vào PR1, nối từ Khách vãng lai. Không bắt buộc |
| D10 | Tên gọi trạng thái món trong BFD và hình use case đang lệch với tài liệu: BFD 2.8 "Hiển thị sản phẩm đã khóa bán" (tài liệu: hết bán), 8.4 / UC47 "Ẩn / hiện sản phẩm" (tài liệu: khóa bán / mở lại), 8.10 / UC39 "Khóa / mở bán sản phẩm" (tài liệu: đặt hết bán / còn bán) | Đổi tên ba chức năng này trong BFD và hình use case cho khớp với ba trạng thái: còn bán, hết bán, khóa bán |
| D11 | Hình use case chưa nhắc nóng / lạnh và ghi chú cho món | Có thể ghi vào UC13 "Chọn mức đá và mức đường" và UC44 "Thiết lập mức đá" cho đủ. Không bắt buộc |
| D12 | Hình use case chưa có **Thiết lập tích điểm và thưởng** (UC69, BFD 11.5) và **Xem các mã giảm giá của tôi** (UC70, BFD 7.3) | Thêm UC69 vào PR12 (nối từ Quản lý) và UC70 vào PR7 (nối từ Khách hàng). Không bắt buộc |
| D13 | Hình use case chưa có **ví hoàn tiền và rút tiền** (UC71 đến UC73) và **xử lý món không làm được** (UC74), và cổng thanh toán giả lập không còn nhận hoàn tiền (UC38 không còn nối với tác nhân Cổng thanh toán) | Thêm UC71, UC72 vào PR7 (Khách hàng), UC73 vào nhóm quản trị (Quản lý), UC74 vào PR11 (Nhân viên); bỏ nối UC38 với Cổng thanh toán. Không bắt buộc |

## 8. Việc còn lại

1. (Tùy chọn) Đổi quyết định mặc định ở mục 6 nếu nhóm không đồng ý.
2. (Tùy chọn) Vẽ thêm vào hình use case theo mục 7. Không bắt buộc.
3. Thiết kế giao diện: folder `10-giao-dien/` đang trống, theo yêu cầu.
4. Khi các sơ đồ khớp 100% thì làm file `.drawio` cho từng sơ đồ (chưa làm, theo yêu cầu).
5. Trước khi code: `schema.prisma` và `API-CONTRACT.md` là file dùng chung, hiện **chưa khớp** với bộ sơ đồ này. Đổi cần báo người kia (CLAUDE.md). BACKLOG chỉ có task 1–10, phần quản trị cần task mới.
