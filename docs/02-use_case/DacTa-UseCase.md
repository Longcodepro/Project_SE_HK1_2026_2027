# 02 · Đặc tả use case

Danh mục và quan hệ UC ở `UseCase-BrewLite.md`. Mã BRxx ở mục 1 là **quy tắc nghiệp vụ dùng chung**, mọi sơ đồ khác dẫn chiếu theo mã này. Mục **[GĐ]** là giả định chưa được nhóm xác nhận (gom ở `09-doi-chieu/DoiChieu-SoDo.md` mục 6).

## 1. Quy tắc nghiệp vụ

| Mã | Quy tắc |
|---|---|
| BR01 | Sản phẩm chỉ lên menu khi `Product.status` là `ON_SALE` hoặc `SOLD_OUT` (không phải `LOCKED`) và `Category.isVisible = true`. |
| BR02 | `Product.status` có 3 giá trị. **Còn bán** (`ON_SALE`): hiện, xem chi tiết, thêm giỏ và đặt được. **Hết bán** (`SOLD_OUT`): vẫn hiện trên menu nhưng bị mờ, xem chi tiết được, không thêm giỏ được, tạo đơn bị từ chối 422. **Khóa bán** (`LOCKED`): không hiện trên menu, mở chi tiết trả 404, tạo đơn trả 404. Ngoài ra món `ON_SALE` mà **hết ly trong ngày** (BR49) cũng không đặt được, hiện mờ như hết bán. |
| BR03 | `unitPrice = ProductSize.price + Σ (Topping.price × số phần của topping đó)`; `lineTotal = unitPrice × quantity`; `subtotal = Σ lineTotal`. |
| BR04 | `iceLevel`, `sugarLevel` phải nằm trong `[min, max]` của sản phẩm. Mức là số nguyên 0–100, bước 25 **[GĐ]**. |
| BR05 | Topping chọn phải thuộc `ProductTopping` của sản phẩm và `Topping.isAvailable = true`. |
| BR06 | Giỏ hàng chỉ nằm ở frontend (`CartStore`, lưu `localStorage` theo từng tài khoản **[GĐ]**), không có bảng. Giá trong giỏ chỉ để hiển thị, server tính lại khi `OrdersService.createOrder`. |
| BR07 | Mã khuyến mãi hợp lệ khi `isActive`, `startsAt ≤ now ≤ endsAt`, `subtotal ≥ minOrderAmount`, còn lượt dùng và đúng chủ (BR39). Có **ba cách giảm** (`discountType`). `FIXED` (giảm thẳng tiền, ví dụ 20.000đ): `discountAmount = min(value, subtotal)`. `PERCENT` (giảm theo phần trăm, có mức giảm tối đa, ví dụ 10% tối đa 30.000đ): `discountAmount = min(floor(subtotal × value / 100), maxDiscountAmount)`; mã `PERCENT` bắt buộc có `maxDiscountAmount`. `FREE_DRINK` (tặng 1 ly): quản lý gắn cho mã một **danh sách món được tặng** (`PromotionProduct`); khách **chọn một ly trong đơn có món thuộc danh sách** (`CheckoutPage.onPickFreeCup`), mã giảm đúng giá ly đó (đã gồm topping và size), tối đa `maxDiscountAmount` nếu quản lý có đặt. Đơn không có ly nào thuộc danh sách thì mã không áp dụng được (422). Mỗi mã chỉ tặng **một** ly. **Mỗi đơn chỉ dùng một mã**, không cộng dồn nhiều mã. Đơn lưu mã đã dùng ở `Order.promotionCode` và hiện trên hóa đơn (BR38). |
| BR08 | `totalAmount = subtotal − discountAmount`. |
| BR09 | Đơn mới có `status = PENDING`. Chỉ thanh toán được khi `PENDING` hoặc `PAYMENT_FAILED`. |
| BR10 | Header `Idempotency-Key` bắt buộc ở `POST /payments`. Key đã dùng thì trả lại kết quả cũ, không gọi cổng lần nữa. Key đã dùng cho đơn hoặc khách khác thì 409. Hai yêu cầu cùng key đến **cùng lúc** vẫn chỉ gọi cổng một lần: `PaymentsService.pay` chạy trong một giao dịch khóa dòng đơn (`SELECT ... FOR UPDATE`), yêu cầu đến sau chờ rồi đọc lại kết quả của yêu cầu đầu; ràng buộc UNIQUE của `Payment.idempotencyKey` là lớp chặn cuối. |
| BR11 | Thanh toán thành công → đơn `PAID`, cộng điểm theo tiền: mỗi `amountStep` đồng được `pointsPerStep` điểm (mặc định **mỗi 10.000đ được 10 điểm**, quản lý chỉnh được, UC69), tính trên số tiền khách đã trả (`totalAmount` sau giảm giá, làm tròn xuống theo bước), đồng thời cộng số ly vào tổng số ly (BR40) **[GĐ]**. |
| BR12 | Nhân viên chuyển `PAID → PREPARING → READY` bằng UC34. `READY` sinh `pickupCode` 6 chữ số. `READY → COMPLETED` chỉ qua UC35 (nhập đúng `pickupCode`). Chuyển sai thứ tự trả 409. |
| BR13 | Hủy được khi `PENDING`, `PAYMENT_FAILED`, `PAID` **[GĐ]**; từ `PREPARING` trở đi trả 409. Hủy đơn đã trả tiền (`PAID`) hoàn `order.totalAmount` **vào ví của khách** với `Refund.reason = CANCEL` (BR43). **Ghi người hủy** (`Order.cancelledByUserId`) **và lý do** (`Order.cancelNote`); **nhân viên hủy bắt buộc nhập lý do** từ 5 đến 200 ký tự (thiếu thì 400), khách tự hủy thì lý do tùy chọn. Quản lý xem lại đơn đã hủy (ai hủy, vì sao, các món trong đơn) ở danh sách đơn lọc `CANCELLED` và chi tiết đơn. |
| BR14 | **Phản hồi dịch vụ (UC28)**: khách gửi `rating` từ 1 đến 5 sao và nhận xét tùy chọn (tối đa 50 từ, không quá 300 ký tự) cho đơn đã `COMPLETED` của mình. Mỗi đơn **một phản hồi**, không sửa hoặc xóa được **[GĐ]**. Gửi lúc nào cũng được sau khi nhận hàng **[GĐ]**. Phản hồi không đổi trạng thái đơn và không tự hoàn tiền. |
| BR15 | **Khách nhận thiếu món**: khách kiểm hàng ngay tại quầy lúc nhận và báo nhân viên tại chỗ. Hệ thống **không có chức năng báo thiếu, không ghi nhận và không hoàn tiền** trong trường hợp này (đơn đã giao thì sang `COMPLETED`, xử lý ngoài hệ thống nếu cần). Khác với món **hết làm được** trước khi giao, nhân viên xử lý bằng UC74 (hoàn tiền món vào ví hoặc đổi món khác, BR45). Phản hồi qua app (BR14) chỉ để ghi nhận chất lượng dịch vụ. |
| BR16 | Mọi hoàn tiền đi qua `RefundsService.refund`, luôn **cộng vào ví của khách** bằng `WalletService.credit` (BR43); không trả về cổng thanh toán. |
| BR17 | Khóa tài khoản đặt `User.isActive = false`: đăng nhập trả 403; JWT cũ bị `JwtStrategy.validate` từ chối 403 ở lần gọi kế tiếp. |
| BR18 | Quyền: UC30–UC39 và UC74 (xử lý món không làm được) cho `STAFF` và `MANAGER`, kèm `GET /admin/products` (xem danh sách, để làm UC39) (riêng xem danh sách các lần xử lý món không làm được, `GET /admin/item-issues`, chỉ `MANAGER`); UC40–UC67, UC69, UC73, UC75 chỉ `MANAGER`; UC71, UC72 và UC70 cho `CUSTOMER`. Kiểm bằng `JwtAuthGuard` rồi `RolesGuard`. |
| BR19 | **Đăng xuất thu hồi JWT**: `AuthStore.logout` gọi `POST /auth/logout`, `AuthService.logout` ghi `jti` vào danh sách thu hồi (`TokenRevocationService.revoke`). `JwtStrategy.validate` từ chối thẻ đã thu hồi bằng 401. Muốn dùng tiếp phải đăng nhập để lấy JWT mới. Thu hồi theo từng thẻ, không ảnh hưởng thẻ ở thiết bị khác. Client luôn xóa phiên cục bộ kể cả khi gọi máy chủ lỗi. |
| BR20 | Đổi trạng thái món (còn bán, hết bán, khóa bán) có hiệu lực tức thời: server không cache, `createOrder` đọc DB mỗi lần. |
| BR21 | Thống kê chỉ tính đơn có `status ∈ {PAID, PREPARING, READY, COMPLETED}`; doanh thu = `Σ totalAmount`. |
| BR22 | **Số điện thoại bắt buộc**, duy nhất, 10 chữ số bắt đầu bằng 0 **[GĐ]**, là tên đăng nhập và **không đổi được sau khi đăng ký**. **Email tùy chọn**; nếu có thì duy nhất, không phân biệt hoa thường. Mật khẩu ≥ 8 ký tự, băm bcrypt. |
| BR23 | Điểm và số ly chỉ cộng, không bị trừ khi hủy/hoàn tiền, và không có chức năng đổi điểm: phần thưởng là mã giảm giá **tự cấp theo mốc** (BR40), nhận thưởng không làm mất điểm **[GĐ]**. |
| BR24 | Khách theo dõi trạng thái đơn bằng polling `OrderDetailPage.poll` mỗi 10 giây, không có push **[GĐ]**. |
| BR25 | `orderCode` dạng `BL` + `yyMMdd` + 4 chữ số ngẫu nhiên, duy nhất. |
| BR26 | `OrderItem` và `OrderItemTopping` lưu **ảnh chụp** tên và giá lúc đặt, đổi giá sau đó không ảnh hưởng đơn cũ. |
| BR27 | Xác thực số điện thoại bằng **OTP mock**: mã 6 chữ số, hạn 5 phút, nhập sai quá 5 lần thì mất hiệu lực, gửi lại cách nhau tối thiểu 60 giây **[GĐ]**. Mã gửi bằng `SmsGateway` (mock, ghi log). Tài khoản `isPhoneVerified = false` không đăng nhập được (403). Môi trường demo có thể dùng mã cố định `123456` **[GĐ]**. |
| BR28 | **Thông báo** gửi ở 4 mốc đơn hàng: `ORDER_CREATED` (tạo đơn), `PAYMENT_SUCCESS` (thanh toán xong, lời cảm ơn), `ORDER_READY` (nước xong, kèm mã nhận hàng), `ORDER_COMPLETED` (nhận xong, lời cảm ơn); và 3 sự kiện không gắn với đơn: `REWARD_ISSUED` (cấp mã thưởng, BR40), `WITHDRAWAL_COMPLETED`, `WITHDRAWAL_REJECTED` (kết quả yêu cầu rút tiền, BR44). Luôn gửi **SMS mock** tới số điện thoại; gửi thêm **email thật** nếu khách có email. Riêng `PAYMENT_SUCCESS`: SMS chỉ **một dòng ngắn** (đã thanh toán thành công, mã đơn, mã giao dịch), còn email là **hóa đơn đầy đủ** (BR38). Lỗi gửi chỉ ghi `Notification.status = FAILED`, không làm hỏng đơn. |
| BR29 | **Khách chưa đăng nhập** xem được menu, món, topping và chọn size, đá, đường, topping, nhưng **thêm vào giỏ phải đăng nhập hoặc đăng ký**. Bấm thêm giỏ khi chưa đăng nhập: món vừa chọn được nhớ tạm (`CartStore.savePending`), chuyển sang đăng nhập hoặc đăng ký, xong thì `CartStore.applyPending` tự thêm món vào giỏ **[GĐ]**. |
| BR30 | **JWT sống 7 ngày** kể từ lúc cấp (`AuthService.issueToken`), không dùng refresh token. Mỗi JWT có một mã riêng `jti`. Quá hạn thì mọi route có JWT trả 401, trang web xóa phiên và đưa khách về đăng nhập. |
| BR31 | **Quên mật khẩu (UC68)**: mã OTP có mục đích (`REGISTER` hoặc `RESET_PASSWORD`) và chỉ dùng đúng mục đích, nên mã đăng ký không đổi được mật khẩu. Bước xin mã luôn trả lời giống nhau dù số có tài khoản hay không. Đặt lại xong khách phải tự đăng nhập; các JWT đã cấp trước đó không bị thu hồi **[GĐ]**. Cùng thông số OTP với BR27. |
| BR32 | **Gợi ý tìm kiếm (UC08)**: gợi ý tên món theo từ khóa đang gõ, tính **ngay trên client** (`MenuPage.filterSuggestions`) từ danh sách món đang hiện đã tải ở UC07, nên không tốn request và không gợi ý món khóa bán (BR01); món hết bán vẫn được gợi ý. Khớp kiểu chứa từ khóa, không phân biệt hoa thường, tối đa 5 gợi ý **[GĐ]**. Chỉ khi khách chọn gợi ý hoặc bấm Enter mới gọi máy chủ để tìm (`MenuPage.onSearch`). Không bỏ dấu tiếng Việt **[GĐ]**. |
| BR33 | **Ai đổi trạng thái món**: Nhân viên và Quản lý đặt **hết bán / còn bán** (UC39, `ProductsService.setSaleStatus`, chỉ giữa `ON_SALE` và `SOLD_OUT`). Chỉ Quản lý **khóa bán / mở lại** (UC47, `ProductsService.setLocked`); mở lại món bị khóa thì về `ON_SALE` **[GĐ]**. Nhân viên không đổi được món đang `LOCKED` (409). |
| BR34 | **Dung tích size**: mỗi `ProductSize` có thêm `volumeMl` (ml) **tùy chọn**, số nguyên từ 1 đến 2000 **[GĐ]**. Quản lý nhập khi thiết lập size (UC42). Trang chi tiết hiện tên size kèm ml nếu có (ví dụ "M · 360 ml"). Đơn lưu ảnh chụp dung tích lúc đặt ở `OrderItem.sizeVolumeMl` (BR26). |
| BR35 | **Nóng / lạnh (tùy món)**: quản lý đặt cho từng món `allowHot`, `allowCold` (ít nhất một) và `defaultTemperature` (UC44). Món cho cả hai thì khách chọn. Món chỉ có **một** nhiệt độ (chỉ nóng hoặc chỉ lạnh) thì ô chọn nóng/lạnh **vẫn hiện nhưng bị khóa** ở nhiệt độ đó, khách không đổi được. Chọn **nóng** thì `iceLevel` bắt buộc bằng 0 (UI khóa ô đá; khoảng đá min–max của món chỉ áp dụng khi chọn lạnh); sai thì tạo đơn trả 422. Giá không đổi theo nhiệt độ **[GĐ]**. |
| BR36 | **Ghi chú cho món**: mỗi dòng giỏ có `note` tùy chọn, **tối đa 20 từ** (tách theo khoảng trắng) và không quá 200 ký tự, văn bản thuần. Khi in hóa đơn, ghi chú nằm dưới dòng món, chữ nhỏ (BR38). Lưu vào `OrderItem.note` và hiện cho nhân viên khi xem chi tiết đơn (UC32). Hai dòng cùng món nhưng khác nhiệt độ hoặc khác ghi chú thì **không gộp** trong giỏ. |
| BR37 | **Giới hạn topping (quản lý đặt cho từng món, UC43)**: `maxPerTopping` là số phần tối đa của **mỗi loại** topping trong một ly, `maxToppingTotal` là **tổng** số phần topping tối đa trong một ly (từ 0 đến 10). Món có topping: `1 ≤ maxPerTopping ≤ maxToppingTotal`; món không có topping: cả hai bằng 0. Khách chọn **số phần** cho từng topping; nút tăng bị khóa khi đủ giới hạn. Giá topping tính theo số phần (BR03). Vượt giới hạn thì tạo đơn trả 422. Mặc định gợi ý khi tạo món: mỗi loại tối đa 1, tổng tối đa 3 **[GĐ]**. |
| BR38 | **Hóa đơn (bill)**: dựng từ đơn, lần thanh toán thành công và các lần hoàn tiền bằng `BillService.buildBill`, không có bảng riêng. **Mỗi loại nước một dòng**: `số ly × tên món (size · ml)` và thành tiền; cùng món nhưng khác tùy chỉnh (size, đá, đường, nóng/lạnh, topping, ghi chú) thì **dòng riêng**. Tùy chọn, topping và ghi chú in chữ nhỏ ngay dưới dòng. Xem trong app (UC25) và **gửi email khi thanh toán thành công** nếu khách có email. Bố cục chi tiết ở `MauHoaDon.md`. |
| BR39 | **Mã khuyến mãi: hai loại và lượt dùng.** Mỗi đơn dùng **một mã** (không cộng dồn nhiều mã). Mã **chung** (`PUBLIC`): ai có mã cũng dùng được; quản lý đặt `maxTotalUses` (tổng lượt, bỏ trống là không giới hạn) và `maxUsesPerUser` (mỗi khách, mặc định 1). Mã **riêng** (`PERSONAL`): gắn một tài khoản (`userId`), chỉ chủ mã dùng được, `maxTotalUses = 1`, có hạn dùng; do quy tắc thưởng cấp (BR40). Lượt dùng tính ngay khi **tạo đơn** (`PromotionsService.recordUsage`) và được **trả lại khi đơn sang `CANCELLED`** (`PromotionsService.releaseUsage`); đơn thanh toán hỏng vẫn giữ lượt vì khách còn thử lại được **[GĐ]**. |
| BR40 | **Tích điểm, tích ly và thưởng.** Điểm tính theo tiền (BR11). Số ly: mỗi đơn thanh toán thành công cộng tổng `quantity` các dòng vào `User.totalCups`. Quản lý đặt các **quy tắc thưởng** (`RewardRule`, UC69): `kind` là `POINTS` hoặc `CUPS`, `threshold`, loại mã thưởng (`PERCENT`, `FIXED` hoặc `FREE_DRINK` kèm danh sách món được tặng, `RewardRuleProduct`), hạn `validDays`; khi cấp mã, danh sách món được sao sang mã mới. Mỗi khi tổng điểm (hoặc ly) của khách vượt thêm một mốc `threshold`, hệ thống **tự cấp một mã riêng** (`LoyaltyService.grantRewards`); số mã đã cấp theo một quy tắc cho một khách luôn bằng `floor(điểm hoặc ly / threshold)`. Nhận thưởng **không trừ điểm hay ly** (BR23). Cấp mã thì gửi SMS `REWARD_ISSUED`. Quy tắc gợi ý mặc định: cứ mỗi 10 ly tặng mã `FREE_DRINK` (hạn 30 ngày), cứ mỗi 500 điểm tặng mã `FIXED` 20.000đ (hạn 30 ngày) **[GĐ]**. |
| BR41 | **Phương thức thanh toán (tạm, sẽ xem lại)**: `EWALLET` ví giả lập (chỉ xác nhận, chưa có số dư), `CARD` thẻ, `TRANSFER` chuyển khoản. **Thẻ**: khách nhập số thẻ 16 số, tên (tùy chọn), hạn MM/YY còn hạn, CVV 3 số; hệ thống **không lưu** các thông tin này, chỉ lưu 4 số cuối. Cổng giả lập theo số thẻ thử (`4111 1111 1111 1111` luôn thành công, `4000 0000 0000 0002` luôn bị từ chối). **Chuyển khoản**: mỗi lần sinh mã tham chiếu (ví dụ `BL2610184821`), hiệu lực **10 phút**; hết hạn thì lần đó thất bại, đơn `PAYMENT_FAILED`, khách thử lại để lấy mã mới; cổng giả lập tự xác nhận sau vài giây **[GĐ]**. |
| BR42 | **Mã nhận hàng dạng số và QR**: `pickupCode` 6 chữ số, hiển thị cả **dạng số** lẫn **mã QR** (QR chứa đúng 6 số đó, dựng ngay trên client, không lưu thêm dữ liệu). Khách đưa số hoặc quét QR ở quầy; hiện tại nhân viên **chỉ nhập số** rồi chạy `AdminOrdersPage.onLookupPickup`. **Quét QR bằng camera ở tài khoản nhân viên là chức năng sẽ làm sau, chưa thuộc phạm vi hiện tại**; khi làm chỉ cần đọc ra 6 số rồi gọi lại đúng bước này, không đổi dữ liệu hay route. QR hiện trong app (trang chi tiết đơn khi `READY`) và trong email thông báo nước xong; SMS chỉ gửi dạng số **[GĐ]**. |
| BR43 | **Ví hoàn tiền**: mỗi khách có `User.walletBalance`. Mọi khoản hoàn tiền (hủy đơn đã trả, hoàn tiền món không làm được) **cộng thẳng vào ví này** (`WalletTransaction` loại `REFUND_IN`). Ví **chỉ nhận tiền hoàn, không dùng thanh toán đơn** và không nạp thêm được. Muốn lấy tiền ra phải rút (BR44). Khác với phương thức thanh toán `EWALLET` (ví điện tử giả lập kiểu MoMo, BR41). |
| BR44 | **Rút tiền từ ví**: khách gửi yêu cầu (UC72) gồm số tiền (từ 10.000 đến số dư), loại nhận (`EWALLET`, `CARD`, `BANK`), tên chủ, số tài khoản, và tên ngân hàng (bắt buộc với thẻ và tài khoản) **[GĐ]**. Số tiền bị **trừ khỏi ví ngay** (`WITHDRAW_OUT`, giữ chỗ). Quản lý **chuyển khoản thủ công** rồi bấm hoàn tất kèm mã giao dịch (`COMPLETED`), hoặc từ chối kèm lý do (`REJECTED`, tiền trả lại ví bằng `WITHDRAW_RETURN`). Chỉ xử lý được yêu cầu đang `PENDING`. Cả hai kết quả đều báo khách bằng SMS (và email nếu có). |
| BR45 | **Xử lý món không làm được (UC74)**: khi một món trong đơn **hết làm được** (hết nguyên liệu), nhân viên phát hiện lúc chuẩn bị hoặc trước khi giao, ghi nhận một `ItemIssue` cho dòng đơn với **số ly** không làm được và lý do bắt buộc (từ 5 ký tự), rồi chọn `REFUND_TO_WALLET` (hoàn đơn giá ly × số ly vào ví, không chia lại khuyến mãi, tổng hoàn của đơn không vượt `totalAmount`, `Refund.reason = MISSING_ITEM`) hoặc `EXCHANGE` (đổi sang món khác ngoài quầy, hệ thống chỉ ghi nhận). Chỉ khi đơn ở `PAID`, `PREPARING` hoặc `READY` (chưa giao). Không đổi trạng thái đơn. Quản lý xem lại danh sách xử lý (ai xử lý, vì sao). |
| BR46 | **Tài khoản nhân viên**: đăng ký công khai (UC01) chỉ tạo `CUSTOMER`. Quản lý tạo tài khoản `STAFF` (UC75) bằng số điện thoại, họ tên và mật khẩu khởi tạo; tài khoản này **không cần OTP** (`isPhoneVerified = true`) và đổi mật khẩu bằng UC06. Tài khoản `MANAGER` đầu tiên được tạo sẵn khi triển khai (seed), không tạo qua giao diện **[GĐ]**. Khóa tài khoản nhân viên dùng UC62. |
| BR47 | **Danh sách phân trang**: mọi danh sách ở trang quản trị (đơn, sản phẩm, khách, phản hồi, yêu cầu rút tiền, món không làm được, khuyến mãi...) mặc định 20 dòng mỗi trang (tối đa 50), mới nhất trước, trả kèm tổng số dòng **[GĐ]**. Không có chức năng xóa hẳn dữ liệu nào (sản phẩm, danh mục, topping, mã, tài khoản): chỉ khóa, ẩn hoặc vô hiệu hóa. |
| BR48 | **Sửa mã khuyến mãi đã dùng (UC58)**: mã đã có lượt dùng thì **không đổi** `code`, cách giảm, giá trị giảm, mức giảm tối đa; chỉ đổi được ngày hết hạn, tổng lượt (không nhỏ hơn số lượt đang tính), số lần mỗi khách, đơn tối thiểu và bật tắt. Mã chưa dùng sửa được mọi thứ trừ `code`. Mã chung gõ không phân biệt hoa thường, lưu chữ hoa, dài 4 đến 20 ký tự gồm chữ và số **[GĐ]**. |
| BR49 | **Số ly bán trong ngày (UC76, UC77)**: quán không quản lý nguyên liệu. Mỗi ngày quản lý ước tính theo kinh nghiệm số ly tối đa của từng món rồi nhập (`Product.dailyQuota`, đồng thời đặt `stockRemaining = dailyQuota`, `stockDate = hôm nay`). Số ly còn lại hôm nay `remainingToday = stockRemaining` nếu `stockDate` là hôm nay (ngày tính theo giờ Việt Nam, UTC+7), **ngược lại bằng 0** (ngày mới mà chưa nhập thì món chưa bán được). UC77 đặt lại cho mọi món chưa khóa bằng đúng `dailyQuota` đã nhập lần gần nhất, dùng khi nguyên liệu nhập về như cũ. Món `ON_SALE` chỉ đặt được khi `remainingToday` đủ cho tổng số ly của món đó trong đơn. Món hết ly vẫn hiện nhưng mờ, `status` không đổi **[GĐ]**. |
| BR50 | **Trừ và trả số ly (UC18, UC27, UC36)**: `OrdersService.createOrder` gọi `ProductsService.reserveStock` trong cùng giao dịch với việc lưu đơn, trừ `stockRemaining` bằng cập nhật có điều kiện kèm `stockVersion` (optimistic locking) nên hai khách đặt cùng lúc không vượt số ly còn lại. Không đủ ly thì 422 và nêu tên món. Đơn bị hủy (`CANCELLED`, trước `PREPARING`) thì `ProductsService.releaseStock` trả lại số ly, **chỉ khi đơn tạo trong ngày hôm nay và không vượt `dailyQuota`** (đơn hôm trước hủy không cộng vào số ly hôm nay). Đơn `PENDING` hoặc `PAYMENT_FAILED` giữ ly cho tới khi thanh toán hoặc bị hủy, không tự hết hạn **[GĐ]**. |
| BR51 | **Thu hồi điểm khi hủy đơn đã trả tiền (UC27, UC36)**: `LoyaltyService.award` ghi `Order.pointsAwarded` lúc `PAID`; hủy đơn `PAID` thì `LoyaltyService.revoke` trừ đúng số điểm đó và số ly của đơn khỏi `User.loyaltyPoints`, `User.totalCups` (không xuống dưới 0). Mã thưởng đã tự cấp trước đó không thu hồi. Xử lý món không làm được (UC74) không đổi điểm **[GĐ]**. |
| BR52 | **Giới hạn số ly mỗi dòng**: mỗi dòng giỏ và dòng đơn từ 1 đến 20 ly **[GĐ]**. Giỏ chặn thêm hoặc tăng vượt 20 và vượt số ly còn lại hôm nay (`remainingToday`) theo dữ liệu đã tải; bản kiểm chính thức ở UC18 (BR49, BR50). |
| BR53 | **Truy cập đồng thời**: mọi thao tác trừ có điều kiện chạy trong giao dịch bằng cập nhật có điều kiện hoặc khóa dòng, không đọc rồi ghi: số ly còn lại (BR50), lượt dùng mã khuyến mãi (`PromotionsService.recordUsage` kiểm `maxTotalUses` và `maxUsesPerUser` trên dòng mã đã khóa), số dư ví khi yêu cầu rút (`WalletService.requestWithdrawal` chỉ trừ khi `walletBalance` đủ), và thanh toán (BR10). |

**Mã lỗi dùng chung:** 400 dữ liệu sai định dạng (class-validator) · 401 chưa đăng nhập, token sai, sai email/mật khẩu · 403 tài khoản bị khóa hoặc thiếu quyền · 404 không tìm thấy (kể cả đơn không phải của mình) · 409 trùng email hoặc sai trạng thái đơn · 422 vi phạm quy tắc nghiệp vụ.

## 2. Phân hệ khách hàng

### UC01 Đăng ký tài khoản (gồm xác thực OTP)
- **Tác nhân:** Khách vãng lai · **Tiền điều kiện:** chưa đăng nhập
- **Luồng chính:** 1. Nhập số điện thoại (bắt buộc), mật khẩu, họ tên, email (tùy chọn) → 2. Hệ thống validate → 3. Kiểm số điện thoại (và email nếu có) chưa ai dùng → 4. Băm bcrypt, lưu `User` role `CUSTOMER`, `isPhoneVerified = false` → 5. `OtpService.sendOtp` gửi mã 6 số qua SMS mock → 6. Khách nhập mã ở `VerifyOtpPage` → 7. `OtpService.verifyOtp` đúng thì `UsersService.markPhoneVerified` → 8. Trả JWT và thông tin user → 9. `AuthStore.setSession`.
- **Thay thế:** 2a. Số điện thoại sai dạng, email sai dạng, mật khẩu < 8 ký tự → 400. 3a. Số điện thoại hoặc email đã có → 409. 7a. Sai mã, hết hạn, quá 5 lần sai → 422, khách có thể bấm gửi lại (cách nhau ≥ 60 giây, sớm hơn → 422).
- **Hậu điều kiện:** có `User` đã xác thực, người dùng đã đăng nhập. Chưa nhập đúng OTP thì tài khoản ở trạng thái chờ xác thực và chưa có JWT. · **Dẫn chiếu:** BR22, BR27 · `Sequence-01-TaiKhoan`

### UC02 Đăng nhập
- **Tác nhân:** Khách vãng lai · **Tiền điều kiện:** có tài khoản
- **Luồng chính:** 1. Nhập số điện thoại, mật khẩu → 2. `AuthService.login` so khớp hash → 3. Trả JWT (hiệu lực 7 ngày, BR30) → 4. `AuthStore.setSession`.
- **Thay thế:** 2a. Sai số điện thoại hoặc mật khẩu → 401. 2b. `isActive = false` → 403 (BR17). 2c. `isPhoneVerified = false` → 403, chuyển sang `VerifyOtpPage` để nhập OTP (có thể gửi lại mã).
- **Hậu điều kiện:** có JWT. · **Dẫn chiếu:** BR27 · `Sequence-01-TaiKhoan`

### UC03 Đăng xuất
- **Tác nhân:** Khách hàng · **Luồng chính:** 1. Bấm đăng xuất → 2. `AuthStore.logout` gọi `POST /auth/logout` → 3. `AuthService.logout` thu hồi JWT (ghi `jti` vào danh sách thu hồi) → 4. Client xóa JWT và thông tin user → 5. Về trang menu. Giỏ hàng đã lưu theo tài khoản, đăng nhập lại là thấy.
- **Thay thế:** 2a. Mất mạng hoặc JWT đã hết hạn nên máy chủ báo lỗi → client vẫn xóa phiên cục bộ (thẻ cũ nếu còn hạn thì vẫn dùng được cho tới hết 7 ngày, chấp nhận được) **[GĐ]**.
- **Sau đăng xuất:** JWT cũ bị từ chối 401, muốn dùng tiếp phải đăng nhập để lấy JWT mới (BR19).
- **Hậu điều kiện:** trở lại Khách vãng lai. · **Dẫn chiếu:** BR19 · `Sequence-01-TaiKhoan`

### UC04 Xem thông tin cá nhân
- **Tác nhân:** Khách hàng · **Luồng chính:** 1. Mở `ProfilePage` → 2. `GET /users/me` → 3. Hiện số điện thoại, họ tên, email (nếu có), điểm. · **Thay thế:** 2a. Chưa đăng nhập → 401. · **Dẫn chiếu:** `Sequence-01-TaiKhoan`

### UC05 Cập nhật thông tin cá nhân
- **Tác nhân:** Khách hàng · **Luồng chính:** 1. Sửa họ tên, thêm hoặc đổi hoặc xóa email → 2. `PATCH /users/me` → 3. Lưu, trả bản mới. · **Thay thế:** 2a. Dữ liệu sai → 400. 2b. Email mới đã có người dùng → 409. **Số điện thoại không đổi được** sau khi đăng ký (đã chốt, BR22): form không có ô số điện thoại và `UpdateProfileDto` không có trường này. · **Dẫn chiếu:** `Sequence-01-TaiKhoan`

### UC06 Đổi mật khẩu
- **Tác nhân:** Khách hàng · **Luồng chính:** 1. Nhập mật khẩu cũ và mới → 2. `PATCH /users/me/password` → 3. Kiểm mật khẩu cũ, băm mới, lưu. · **Thay thế:** 2a. Mật khẩu mới < 8 ký tự → 400. 3a. Mật khẩu cũ sai → 401. · **Dẫn chiếu:** BR22 · `Sequence-01-TaiKhoan`

### UC68 Quên mật khẩu (bổ sung ngoài BFD gốc)
- **Tác nhân:** Khách vãng lai (người đã có tài khoản nhưng quên mật khẩu) · **Tiền điều kiện:** chưa đăng nhập, số điện thoại đã đăng ký và xác thực
- **Luồng chính:** 1. Ở trang đăng nhập bấm "Quên mật khẩu?" → 2. Nhập số điện thoại ở `ForgotPasswordPage.onRequestOtp` → 3. `AuthService.forgotPassword` kiểm tài khoản rồi `OtpService.sendOtp` gửi mã 6 số (mục đích `RESET_PASSWORD`) qua SMS mock → 4. Nhập mã và mật khẩu mới ở `ForgotPasswordPage.onResetPassword` → 5. `AuthService.resetPassword` gọi `OtpService.verifyOtp` → 6. `UsersService.setPassword` lưu mật khẩu mới (băm bcrypt) → 7. Về trang đăng nhập, khách đăng nhập bằng mật khẩu mới.
- **Thay thế:** 3a. Số chưa đăng ký, chưa xác thực hoặc tài khoản bị khóa → hệ thống **không gửi mã nhưng vẫn trả lời giống hệt** ("Nếu số này đã đăng ký thì mã đã được gửi"), để người lạ không dò ra số nào có tài khoản. 3b. Xin mã lại trong 60 giây → 422. 4a. Mật khẩu mới < 8 ký tự → 400. 5a. Sai mã, hết hạn, quá 5 lần nhập sai → 422.
- **Hậu điều kiện:** mật khẩu đã đổi, khách **chưa** đăng nhập. JWT đã cấp trước đó không bị thu hồi **[GĐ]**. · **Dẫn chiếu:** BR27, BR31 · `Sequence-01-TaiKhoan` mục F

### UC69 Thiết lập tích điểm và thưởng (bổ sung ngoài BFD gốc)
- **Tác nhân:** Quản lý · **Tiền điều kiện:** đã đăng nhập vai trò `MANAGER`
- **Luồng chính:** 1. Mở `AdminLoyaltyPage` → 2. Xem tỉ lệ tích điểm (`LoyaltyService.getSettings`) và danh sách quy tắc thưởng (`LoyaltyService.listRules`) → 3. Đổi tỉ lệ: mỗi `amountStep` đồng được `pointsPerStep` điểm (mặc định 10.000đ được 10 điểm) → 4. Thêm hoặc sửa quy tắc thưởng: chọn `kind` (`POINTS` hoặc `CUPS`), `threshold`, loại mã thưởng và hạn dùng → 5. Bật hoặc tắt quy tắc.
- **Thay thế:** `amountStep` dưới 1000 hoặc `pointsPerStep` dưới 1 → 400. Quy tắc có `PERCENT` mà thiếu mức giảm tối đa, `validDays` ngoài 1 đến 365, `threshold` dưới 1 → 400. Không có quy tắc → 404.
- **Hậu điều kiện:** chỉ áp dụng cho các đơn thanh toán từ lúc đổi trở đi; điểm và mã đã cấp không bị tính lại. · **Dẫn chiếu:** BR11, BR40 · `Sequence-11-QuanTriCRUD` mục B2

### UC70 Xem các mã giảm giá của tôi (bổ sung ngoài BFD gốc)
- **Tác nhân:** Khách hàng · **Tiền điều kiện:** đã đăng nhập
- **Luồng chính:** 1. Mở hồ sơ (`ProfilePage.loadVouchers`) hoặc bước đặt hàng (`CheckoutPage.loadMyVouchers`) → 2. `GET /promotions/mine` → 3. Hiện danh sách: mã riêng của khách (còn dùng, đã dùng, hết hạn) và mã chung còn lượt, mỗi mã kèm mô tả (ví dụ "Giảm 20.000đ", "Giảm 10%, tối đa 30.000đ", "Tặng 1 ly") và hạn dùng → 4. Khách chọn một mã để dùng ở UC19.
- **Thay thế:** chưa đăng nhập → 401.
- **Hậu điều kiện:** chỉ xem, không đổi dữ liệu. · **Dẫn chiếu:** BR39, BR40 · `Sequence-06-TheoDoiDon`, `Sequence-04-DatHang`

### UC71 Xem ví hoàn tiền (bổ sung ngoài BFD gốc)
- **Tác nhân:** Khách hàng · **Luồng chính:** 1. Mở `WalletPage` → 2. `GET /wallet` → 3. Hiện số dư và lịch sử biến động (tiền hoàn vào, rút ra, trả lại). · **Thay thế:** chưa đăng nhập → 401. · **Dẫn chiếu:** BR43 · `Sequence-15-ViHoanTien`

### UC72 Yêu cầu rút tiền từ ví (bổ sung ngoài BFD gốc)
- **Tác nhân:** Khách hàng · **Tiền điều kiện:** có số dư ≥ 10.000đ.
- **Luồng chính:** 1. Nhập số tiền, loại nhận (ví điện tử, thẻ, tài khoản), tên chủ, số tài khoản, ngân hàng → 2. `POST /wallet/withdrawals` → 3. `WalletService.requestWithdrawal` lưu yêu cầu `PENDING` và **trừ ví ngay** → 4. Khách theo dõi trạng thái ở danh sách yêu cầu của mình (`GET /wallet/withdrawals`).
- **Thay thế:** thiếu thông tin hoặc số tiền dưới 10.000 → 400; số tiền lớn hơn số dư → 422. · **Dẫn chiếu:** BR44 · `Sequence-15-ViHoanTien`

### UC73 Xử lý yêu cầu rút tiền (bổ sung ngoài BFD gốc)
- **Tác nhân:** Quản lý · **Luồng chính:** 1. Mở `AdminWithdrawalsPage`, lọc yêu cầu `PENDING` → 2. Xem thông tin nhận → 3. **Chuyển khoản thủ công** ngoài hệ thống → 4. Bấm hoàn tất kèm mã giao dịch (`PATCH /admin/withdrawals/:id/complete`) → 5. Yêu cầu `COMPLETED`, khách nhận SMS.
- **Thay thế:** 4a. Từ chối kèm lý do (`PATCH /admin/withdrawals/:id/reject`) → yêu cầu `REJECTED`, tiền trả lại ví, khách nhận SMS. 4b. Yêu cầu không còn `PENDING` → 409; thiếu mã giao dịch hoặc lý do → 400. · **Dẫn chiếu:** BR44 · `Sequence-15-ViHoanTien`

### UC74 Xử lý món không làm được (bổ sung ngoài BFD gốc)
- **Tác nhân:** Nhân viên, Quản lý · **Tiền điều kiện:** đơn ở `PAID`, `PREPARING` hoặc `READY` (chưa giao).
- **Luồng chính:** 1. Nhân viên thấy một món trong đơn hết làm được (hết nguyên liệu) → 2. Chọn dòng và số ly không làm được, chọn **hoàn tiền vào ví** hoặc **đổi món khác**, nhập lý do → 3. `POST /admin/orders/:id/item-issues` → 4. `OrdersService.handleMissingItem` lưu `ItemIssue` (ai xử lý, vì sao); nếu hoàn tiền thì qua UC38 vào ví → 5. Quản lý xem danh sách ở `GET /admin/item-issues`.
- **Thay thế:** đơn chưa trả tiền, đã giao (`COMPLETED`) hoặc đã hủy → 409; số ly vượt phần còn lại → 422; thiếu lý do → 400. Món không làm được **không** trả lại số ly của ngày (nguyên liệu đã hết thật) và không đổi điểm (BR51). · **Dẫn chiếu:** BR45 · `Sequence-16-XuLyMonKhongLamDuoc`

### UC76 Thiết lập số ly bán trong ngày (bổ sung ngoài BFD gốc, BFD 8.11)
- **Tác nhân:** Quản lý · **Luồng chính:** 1. Mỗi ngày quản lý nhìn nguyên liệu đã chuẩn bị, ước tính theo kinh nghiệm số ly tối đa của từng món → 2. Mở `AdminProductsPage`, nhập số ly cho món (`AdminProductsPage.onSetDailyStock`) → 3. `PUT /admin/products/:id/daily-stock` kèm `quantity` → 4. `ProductsService.setDailyStock` đặt `dailyQuota = stockRemaining = quantity`, `stockDate = hôm nay`, tăng `stockVersion`.
- **Thay thế:** `quantity` không phải số nguyên từ 0 đến 9999 → 400; không có sản phẩm → 404. Nhập lại giữa ngày thì **thay hẳn** số còn lại bằng số mới (không cộng thêm) **[GĐ]**. · **Dẫn chiếu:** BR49 · `Sequence-10-QuanLySanPham`

### UC77 Dùng lại số ly của hôm qua (bổ sung ngoài BFD gốc, BFD 8.12)
- **Tác nhân:** Quản lý · **Luồng chính:** 1. Đầu ngày nguyên liệu nhập về như cũ → 2. Bấm "Dùng lại như hôm qua" (`AdminProductsPage.onReuseYesterdayStock`) → 3. `POST /admin/products/daily-stock/reuse` → 4. `ProductsService.reuseYesterdayStock` với mọi món chưa khóa: `stockRemaining = dailyQuota`, `stockDate = hôm nay`, trả số món đã đặt lại.
- **Thay thế:** món chưa từng nhập (`dailyQuota = 0`) thì giữ 0; món `LOCKED` bỏ qua. Sau đó vẫn chỉnh từng món bằng UC76. · **Dẫn chiếu:** BR49 · `Sequence-10-QuanLySanPham`

### UC75 Tạo tài khoản nhân viên (bổ sung ngoài BFD gốc)
- **Tác nhân:** Quản lý · **Luồng chính:** 1. Mở `AdminUsersPage`, bấm tạo nhân viên → 2. Nhập số điện thoại, họ tên, mật khẩu khởi tạo, email (tùy chọn) (`AdminUsersPage.onCreateStaff`) → 3. `POST /admin/staff` → 4. `UsersService.createStaff` lưu `User` vai trò `STAFF`, đã xác thực số điện thoại, không cần OTP → 5. Quản lý đưa số điện thoại và mật khẩu cho nhân viên, nhân viên đăng nhập (UC02) rồi tự đổi mật khẩu (UC06).
- **Thay thế:** số điện thoại đã dùng → 409; dữ liệu sai → 400; không phải quản lý → 403. · **Dẫn chiếu:** BR46 · `Sequence-11-QuanTriCRUD` mục B3

### UC07 Xem danh sách menu
- **Tác nhân:** Khách vãng lai · **Luồng chính:** 1. Mở `MenuPage` → 2. Tải danh mục (`GET /categories`) và sản phẩm (`GET /products`) → 3. Hiện lưới sản phẩm còn bán và hết bán; sản phẩm hết bán hoặc hết ly trong ngày (BR49) hiện mờ. · **Thay thế:** 3a. Không có sản phẩm → hiện trạng thái rỗng. · **Dẫn chiếu:** BR01, BR02 · `Sequence-02-XemMenu`

### UC08 Tìm kiếm sản phẩm theo tên (extend UC07)
- **Luồng chính:** 1. Khách gõ vào ô tìm kiếm → 2. `MenuPage.onType` lọc ngay trên client từ danh sách món đã tải ở UC07 và hiện tối đa 5 tên món gợi ý, không gọi máy chủ (BR32) → 3. Khách chọn một gợi ý (`MenuPage.onPickSuggestion`) hoặc tự bấm Enter (`MenuPage.onSearch`) → 4. `GET /products?search=` → 5. Lọc tên chứa từ khóa, không phân biệt hoa thường.
- **Thay thế:** 2a. Không có món nào khớp → không hiện gợi ý. 2b. Ô tìm kiếm trống → không gọi gợi ý. · **Dẫn chiếu:** `Sequence-02-XemMenu`

### UC09 Lọc sản phẩm theo danh mục (extend UC07)
- **Luồng chính:** 1. Chọn danh mục → 2. `GET /products?categoryId=` → 3. Hiện sản phẩm của danh mục. · **Dẫn chiếu:** `Sequence-02-XemMenu`

### UC10 Xem chi tiết sản phẩm
- **Tác nhân:** Khách vãng lai · **Luồng chính:** 1. Chọn sản phẩm → 2. `GET /products/:id` → 3. Hiện ảnh, mô tả, size kèm giá và dung tích ml (nếu có), mức đá/đường min–max–mặc định, danh sách topping.
- **Thay thế:** 2a. Sản phẩm khóa bán hoặc không có → 404. 3a. Sản phẩm hết bán (`SOLD_OUT`) hoặc hết ly trong ngày (BR49) → hiện mờ, nút thêm giỏ vô hiệu (BR02). · **Dẫn chiếu:** `Sequence-02-XemMenu`

### UC11 Thêm món vào giỏ hàng (include UC12, UC13, UC14)
- **Tác nhân:** Khách hàng (khách vãng lai chọn được tùy chọn nhưng phải đăng nhập mới thêm giỏ) · **Tiền điều kiện:** sản phẩm còn bán (`ON_SALE`) và còn ly hôm nay (BR49), đã đăng nhập
- **Luồng chính:** 1. Chọn size (UC12), mức đá và đường (UC13), topping (UC14) → 2. `ProductDetailPage.calcUnitPrice` → 3. Bấm "Thêm vào giỏ" → 4. `AuthStore.isLoggedIn` → 5. `CartStore.addItem` (chặn nếu dòng vượt 20 ly hoặc vượt số ly còn lại hôm nay, BR52) → 6. Tổng tiền và badge cập nhật.
- **Thay thế:** 4a. Chưa đăng nhập → `CartStore.savePending` nhớ tạm món, chuyển sang `LoginPage` hoặc `RegisterPage`; đăng nhập xong `CartStore.applyPending` tự thêm món (BR29). 5a. Cùng sản phẩm và cùng tùy chọn đã có trong giỏ → cộng dồn số lượng. · **Dẫn chiếu:** BR03, BR06 · `Sequence-03-GioHang`

### UC12 Chọn size · UC13 Chọn mức đá và mức đường · UC14 Chọn topping thêm
- **Không cần đăng nhập.** **Luồng chính:** chọn `sizeCode` (giá theo size), `iceLevel` và `sugarLevel` (BR04), chọn số phần cho từng topping (`ProductDetailPage.setToppingQuantity`, BR05, BR37; 0 phần nghĩa là bỏ topping đó); giá tạm tính cập nhật ngay. Món cho phép cả nóng và lạnh thì chọn thêm nhiệt độ (`ProductDetailPage.selectTemperature`); món chỉ có một nhiệt độ thì ô chọn bị khóa ở nhiệt độ đó; chọn nóng thì mức đá về 0 và bị khóa (BR35). Khách có thể ghi chú tùy chọn cho món (`ProductDetailPage.setNote`, BR36).
- **Thay thế:** UC13 mức ngoài `[min, max]` thì UI không cho chọn. UC14 topping khóa bán thì UI không hiện. · **Dẫn chiếu:** `Sequence-03-GioHang`

### UC15 Sửa số lượng · UC16 Sửa tùy chọn của món trong giỏ · UC17 Xóa sản phẩm khỏi giỏ
- **Tác nhân:** Khách hàng (đã đăng nhập, vì giỏ chỉ có sau khi đăng nhập) · **Luồng chính:** `CartPage` gọi `CartStore.updateQuantity`, `CartStore.updateOptions`, `CartStore.removeItem`; sau mỗi thao tác `CartStore.getTotal` tính lại.
- **Thay thế:** UC15 số lượng < 1 không hợp lệ (dùng UC17 để xóa), số lượng > 20 hoặc > số ly còn lại hôm nay thì chặn (BR52). UC16 đổi thành tùy chọn trùng dòng khác thì gộp dòng. · **Dẫn chiếu:** BR03, BR06 · `Sequence-03-GioHang`

### UC18 Tạo đơn hàng (extend: UC19)
- **Tác nhân:** Khách hàng · **Tiền điều kiện:** đã đăng nhập, giỏ không rỗng
- **Luồng chính:** 1. `CheckoutPage` gửi `POST /orders` → 2. Tải sản phẩm và kiểm từng dòng (4.1: BR02, BR04, BR05, BR35, BR37) → 3. Tính giá (BR03) → 4. Nếu có mã khuyến mãi thì kiểm (BR07, BR39) → 5. Trừ số ly còn lại của từng món: `ProductsService.reserveStock` (BR49, BR50) → 6. Tạo `Order` `PENDING` cùng dòng và topping (BR26), cùng giao dịch với bước 5 → 7. Nếu có mã thì ghi lượt dùng mã (BR39) → 8. Gửi thông báo `ORDER_CREATED` (BR28) → 9. Trả đơn → 10. `CartStore.clear`, chuyển sang `PaymentPage`.
- **Thay thế:** 2a. Sản phẩm khóa bán, không có hoặc thuộc danh mục đang ẩn → 404. 2b. Sản phẩm hết bán, size, đá, đường, nhiệt độ hoặc topping sai, vượt giới hạn topping → 422, giữ giỏ. 4a. Mã sai, hết lượt, mã tặng ly mà không chọn ly hợp lệ → 422. 5a. Không đủ số ly còn lại của một món (kể cả khi hai khách đặt cùng lúc) → 422 nêu tên món, không tạo đơn, giữ giỏ.
- **Hậu điều kiện:** có `Order` `PENDING`. · **Dẫn chiếu:** BR09, BR20, BR25 · `Sequence-04-DatHang`

### UC19 Áp dụng mã khuyến mãi (extend UC18)
- **Luồng chính:** 1. Chọn một mã trong danh sách mã của mình (UC70, `CheckoutPage.loadMyVouchers`) hoặc tự gõ mã → 2. Nếu là mã tặng ly, khách chọn một ly trong đơn thuộc danh sách của mã (`CheckoutPage.onPickFreeCup`) → 3. `GET /promotions/validate?code=&subtotal=&pickedCup=` → 4. Hiện số tiền giảm và tổng mới. Mỗi đơn một mã; áp mã khác thì thay mã cũ (BR39).
- **Thay thế:** 2a. Mã không tồn tại, hết hạn, bị vô hiệu, chưa đủ `minOrderAmount`, hết lượt dùng, khách đã dùng đủ lượt của mình, hoặc là mã riêng của người khác → 422, hiện lỗi, đặt hàng tiếp không giảm giá. · **Dẫn chiếu:** BR07, BR08 · `Sequence-04-DatHang`

### UC20 Xác nhận thông tin đơn
- **Luồng chính:** 1. `CheckoutPage` hiện tóm tắt (dòng, tùy chọn, giảm giá, tổng) → 2. Khách bấm "Xác nhận đặt hàng" (UC18) → 3. Sau khi tạo, hiện `orderCode`.
- **Thay thế:** giỏ rỗng → quay `CartPage`. Chưa đăng nhập → `LoginPage`. · **Dẫn chiếu:** `Sequence-04-DatHang`

### UC21 Chọn phương thức thanh toán
- **Luồng chính:** `PaymentPage.selectMethod` chọn `EWALLET` (ví điện tử giả lập), `CARD` (nhập số thẻ, tên, hạn, CVV) hoặc `TRANSFER` (chuyển khoản theo mã tham chiếu, hiệu lực 10 phút) (BR41). Ví hoàn tiền (BR43) **không** phải phương thức thanh toán. · **Dẫn chiếu:** `Sequence-05-ThanhToan`

### UC22 Thực hiện giao dịch thanh toán (include UC21; tác nhân phụ: Cổng mock)
- **Tiền điều kiện:** đơn của khách ở `PENDING` hoặc `PAYMENT_FAILED`, có `Idempotency-Key`.
- **Luồng chính:** 1. `POST /payments` → 2. Nếu key đã dùng thì trả kết quả cũ → 3. Kiểm đơn thuộc khách và đúng trạng thái → 4. `PaymentGateway.charge` → 5. Lưu `Payment` → 6. Thành công: đơn `PAID`, gửi SMS ngắn (mã đơn + mã giao dịch) và email hóa đơn nếu khách có email (`PAYMENT_SUCCESS`, BR28, BR38), cộng điểm và số ly rồi cấp mã thưởng nếu đạt mốc (7.1, BR11, BR40) → 7. Hiện `orderCode`.
- **Thay thế:** 2a. Key đã dùng cho đơn hoặc khách khác → 409. 3a. Đơn không phải của khách → 404. 3b. Sai trạng thái → 409. 4a. Cổng báo thất bại, hoặc chuyển khoản quá 10 phút chưa xác nhận: `Payment` `FAILED`, đơn `PAYMENT_FAILED`, hiện nút thử lại (UC23).
- **Hậu điều kiện:** `PAID` hoặc `PAYMENT_FAILED`. · **Dẫn chiếu:** BR09, BR10, BR11 · `Sequence-05-ThanhToan`

### UC23 Thử lại khi thanh toán thất bại (extend UC22)
- **Tiền điều kiện:** đơn `PAYMENT_FAILED`. · **Luồng chính:** bấm thử lại → sinh `Idempotency-Key` mới → lặp UC22. · **Dẫn chiếu:** `Sequence-05-ThanhToan`

### UC24 Xem lịch sử đơn hàng
- **Luồng chính:** `OrderHistoryPage.load` → `GET /orders/me` → danh sách đơn của khách, mới nhất trước. · **Dẫn chiếu:** `Sequence-06-TheoDoiDon`

### UC25 Xem chi tiết đơn hàng
- **Luồng chính:** `OrderDetailPage.load` → `GET /orders/:id` → dòng, topping, giảm giá, tổng, trạng thái, phản hồi dịch vụ nếu đã gửi (UC28); đơn đã hủy hiện thêm lý do hủy; trang tự poll (BR24). Đơn đã thanh toán có nút xem **hóa đơn** (`OrderDetailPage.openBill` → `GET /orders/:id/bill`, mẫu ở `MauHoaDon.md`, BR38); đơn chưa thanh toán gọi hóa đơn trả 409. · **Thay thế:** đơn không phải của khách → 404. · **Dẫn chiếu:** `Sequence-06-TheoDoiDon`

### UC26 Xem mã nhận hàng
- **Tiền điều kiện:** đơn `READY`. · **Luồng chính:** poll thấy trạng thái `READY` → hiện `pickupCode` dạng số và dạng mã QR (BR42). Các trạng thái khác không có mã. · **Dẫn chiếu:** BR12 · `Sequence-06-TheoDoiDon`

### UC27 Hủy đơn hàng (khách)
- **Tiền điều kiện:** đơn của khách ở `PENDING`, `PAYMENT_FAILED`, `PAID` (BR13).
- **Luồng chính:** 1. Bấm hủy → 2. `POST /orders/:id/cancel` → 3. Nếu đã trả tiền thì hoàn đủ vào ví của khách (UC38) → 4. Đơn `CANCELLED`, `cancelReason = CUSTOMER_CANCEL` → 5. Nếu đơn có dùng mã khuyến mãi thì trả lại lượt dùng mã (BR39) → 6. Trả lại số ly của các món trong đơn: `ProductsService.releaseStock` (BR50) → 7. Nếu đơn đã `PAID` thì thu hồi điểm và số ly: `LoyaltyService.revoke` (BR51).
- **Thay thế:** 3a. Đơn từ `PREPARING` trở đi → 409. · **Dẫn chiếu:** BR13, BR16 · `Sequence-07-HuyDon`

### UC28 Gửi phản hồi dịch vụ (thang 5 sao)
- **Tác nhân:** Khách hàng · **Tiền điều kiện:** đơn của khách ở `COMPLETED`, chưa có phản hồi.
- **Luồng chính:** 1. Khách mở chi tiết đơn đã nhận → 2. Chọn 1 đến 5 sao và ghi nhận xét (tùy chọn) → 3. `OrderDetailPage.onSubmitFeedback` gọi `POST /orders/:id/feedback` → 4. `FeedbackService.submit` lưu `ServiceFeedback` → 5. Trang hiện phản hồi đã gửi.
- **Thay thế:** 3a. Đơn không phải của khách → 404. 3b. Đơn chưa `COMPLETED` hoặc đã có phản hồi → 409. 3c. Số sao ngoài 1 đến 5, nhận xét quá dài → 400. · **Dẫn chiếu:** BR14, BR15 · `Sequence-08-PhanHoiDichVu`

### UC29 Xem điểm tích lũy
- **Luồng chính:** `ProfilePage.loadPoints` → `GET /users/me/points` → hiện số điểm, số ly đã mua và còn thiếu bao nhiêu tới mốc thưởng kế tiếp (BR40). · **Dẫn chiếu:** BR11, BR23 · `Sequence-06-TheoDoiDon`

## 3. Phân hệ quản trị — Nhân viên

### UC30 Xem danh sách đơn hàng (extend: UC31)
- **Tác nhân:** Nhân viên, Quản lý · **Luồng chính:** `AdminOrdersPage.load` → `GET /admin/orders` → mọi đơn, mới nhất trước. · **Thay thế:** thiếu quyền → 403. · **Dẫn chiếu:** BR18 · `Sequence-09-XuLyDon`

### UC31 Lọc đơn theo trạng thái (extend UC30)
- **Luồng chính:** chọn trạng thái → `GET /admin/orders?status=`. · **Thay thế:** trạng thái không thuộc enum → 400. · **Dẫn chiếu:** `Sequence-09-XuLyDon`

### UC32 Xem chi tiết đơn hàng (include UC33)
- **Luồng chính:** `AdminOrdersPage.onOpen` → `GET /admin/orders/:id` → thông tin đơn, khách, dòng (kèm size, đá, đường, nóng/lạnh, topping và ghi chú của khách), kèm thanh toán (UC33). · **Thay thế:** không có đơn → 404. · **Dẫn chiếu:** `Sequence-09-XuLyDon`

### UC33 Xem thông tin thanh toán của đơn
- **Luồng chính:** `OrdersService.getDetail` gọi `PaymentsService.getByOrder` → danh sách `Payment` (phương thức, số tiền, trạng thái, mã tham chiếu) và `Refund` của đơn. · **Dẫn chiếu:** `Sequence-09-XuLyDon`

### UC34 Cập nhật trạng thái đơn
- **Tiền điều kiện:** đơn `PAID` hoặc `PREPARING`.
- **Luồng chính:** 1. Chọn trạng thái tiếp theo → 2. `PATCH /admin/orders/:id/status` → 3. `assertTransition` → 4. `PAID → PREPARING` hoặc `PREPARING → READY` (sinh `pickupCode`, gửi thông báo `ORDER_READY` kèm mã nhận hàng, BR28).
- **Thay thế:** 3a. Chuyển sai thứ tự, hoặc đích là `COMPLETED`/`CANCELLED` → 409. · **Dẫn chiếu:** BR12 · `Sequence-09-XuLyDon`, `State-01-DonHang`

### UC35 Giao món cho khách
- **Tiền điều kiện:** đơn `READY`.
- **Luồng chính:** 1. Khách đưa mã số (hoặc cho xem QR để nhân viên đọc số; quét camera chưa làm, BR42) → 2. Tra đơn theo mã (`GET /admin/orders/by-pickup-code/:code`) → 3. Nhân viên đối chiếu → 4. Bấm xác nhận giao (`POST /admin/orders/:id/complete`) → 5. Đơn `COMPLETED`, gửi lời cảm ơn `ORDER_COMPLETED` (BR28).
- **Thay thế:** 2a. Không có đơn với mã → 404. 4a. Đơn không `READY` → 409. 4b. Mã gửi lên không khớp → 422. · **Dẫn chiếu:** BR12 · `Sequence-09-XuLyDon`

### UC36 Hủy đơn hàng (nhân viên)
- **Luồng chính:** như UC27 nhưng nhân viên hủy được đơn của bất kỳ khách: 1. Bấm hủy và **nhập lý do** (bắt buộc, từ 5 đến 200 ký tự) → 2. `POST /admin/orders/:id/cancel` kèm `note` → 3. `OrdersService.cancelByStaff` kiểm đơn rồi `cancelOrder` → 4. Đơn `CANCELLED` với `cancelReason = STAFF_CANCEL`, **ghi nhân viên đã hủy** (`cancelledByUserId`) và lý do (`cancelNote`) → 5. Đơn đã trả tiền thì hoàn đủ **vào ví của khách** (UC38) → 6. Trả lại số ly và (nếu đã `PAID`) thu hồi điểm như UC27 (BR50, BR51).
- **Thay thế:** thiếu lý do → 400; đơn từ `PREPARING` trở đi → 409; không có đơn → 404.
- **Xem lại:** quản lý lọc đơn `CANCELLED` (UC31) và mở chi tiết (UC32) để xem ai hủy, vì sao, các món trong đơn. · **Dẫn chiếu:** BR13 · `Sequence-07-HuyDon`

### UC37 Xem phản hồi dịch vụ
- **Tác nhân:** Nhân viên, Quản lý · **Luồng chính:** 1. Mở `AdminFeedbackPage` → 2. `GET /admin/feedback` (lọc theo số sao nếu muốn) → 3. `FeedbackService.listAll` trả danh sách phản hồi kèm mã đơn, tên khách, số sao, nhận xét, mới nhất trước. Phản hồi của từng đơn cũng hiện ở chi tiết đơn (UC32).
- **Thay thế:** thiếu quyền → 403; số sao lọc ngoài 1 đến 5 → 400. · **Dẫn chiếu:** BR14, BR18 · `Sequence-08-PhanHoiDichVu`

### UC38 Hoàn tiền vào ví
- **Luồng chính:** `RefundsService.refund(order, amount, reason, actorId, note)` lưu `Refund` rồi `WalletService.credit` **cộng tiền vào ví của khách** (BR43). Hệ thống tự gọi khi hủy đơn đã trả tiền (UC27, UC36, hoàn đủ `totalAmount`) và khi nhân viên chọn hoàn tiền món thiếu vào ví (UC74). Không còn gọi cổng thanh toán. · **Dẫn chiếu:** BR16, BR43 · `Sequence-07-HuyDon`, `Sequence-15-ViHoanTien`

### UC39 Đặt hết bán / còn bán sản phẩm (BFD 8.10 "Khóa / mở bán tức thời")
- **Tác nhân:** Nhân viên, Quản lý · **Luồng chính:** chọn `SOLD_OUT` (hết bán) hoặc `ON_SALE` (còn bán) → `PATCH /admin/products/:id/sale-status` → có hiệu lực ngay (BR20). Món hết bán vẫn hiện nhưng mờ và không đặt được. · **Thay thế:** không có sản phẩm → 404; món đang `LOCKED` → 409; trạng thái ngoài hai giá trị trên → 400 (BR33). · **Dẫn chiếu:** `Sequence-10-QuanLySanPham`

## 4. Phân hệ quản trị — Quản lý

### UC40 Xem danh sách sản phẩm
- `GET /admin/products` trả cả sản phẩm khóa bán và hết bán, kèm trạng thái, `dailyQuota` và `remainingToday` (BR49). Nhân viên cũng gọi được route này (chỉ xem) để chọn món đặt hết bán ở UC39. · `Sequence-10-QuanLySanPham`

### UC41 Thêm sản phẩm mới (include UC42, UC43, UC44, UC45)
- **Luồng chính:** 1. Nhập tên, mô tả, ảnh, danh mục → 2. Thiết lập size và giá (UC42), topping áp dụng (UC43), mức đá min/max/mặc định (UC44), mức đường min/max/mặc định (UC45) → 3. `POST /admin/products` → 4. Lưu `Product` (trạng thái mặc định còn bán, kèm nhiệt độ được phép và giới hạn topping), `ProductSize`, `ProductTopping`.
- **Thay thế:** 3a. Thiếu size, `min ≤ default ≤ max` sai, giá âm → 400. 3b. Danh mục hoặc topping không tồn tại → 404. · `Sequence-10-QuanLySanPham`

### UC42–UC45 Thiết lập size/giá, topping, mức đá, mức đường
- Là các phần của form UC41 và UC46, gửi trong cùng một request. Size: ≥ 1 dòng, `sizeCode` không trùng, giá ≥ 0, dung tích `volumeMl` tùy chọn từ 1 đến 2000 ml (BR34). Quản lý thêm, sửa, bớt các size của từng món ngay trong form thêm hoặc sửa món. Topping: các `toppingId` phải tồn tại; quản lý đặt thêm `maxPerTopping` (số phần tối đa mỗi loại) và `maxToppingTotal` (tổng số phần tối đa), xem BR37. Mức đá/đường: `0 ≤ min ≤ default ≤ max ≤ 100`. Nhiệt độ (đi kèm UC44): ít nhất một trong nóng, lạnh; mặc định phải thuộc nhiệt độ được phép (BR35).

### UC46 Cập nhật thông tin sản phẩm
- `PATCH /admin/products/:id` gửi các trường cần đổi, gồm cả size/topping/đá/đường (thay thế toàn bộ danh sách gửi lên). Đơn cũ không đổi vì BR26. · `Sequence-10-QuanLySanPham`

### UC47 Khóa bán / mở lại sản phẩm (BFD 8.4 "Ẩn / hiện")
- `PATCH /admin/products/:id/lock` đặt `LOCKED` (khóa bán, biến khỏi menu, chi tiết trả 404) hoặc đưa về `ON_SALE` (mở lại). Chỉ Quản lý (BR33). Khác với hết bán ở UC39: hết bán vẫn hiện nhưng mờ. · `Sequence-10-QuanLySanPham`

### UC48–UC67 Quản trị dạng CRUD, thống kê và người dùng
Khuôn chung: `JwtAuthGuard` → `RolesGuard(MANAGER)` → validate DTO (400) → service → lưu. Không có bản ghi → 404, trùng khóa duy nhất → 409.

| UC | Chức năng | Điểm riêng |
|---|---|---|
| UC48 | Xem danh sách danh mục | Gồm cả danh mục ẩn |
| UC49 | Thêm danh mục | Tên duy nhất → 409 nếu trùng |
| UC50 | Cập nhật danh mục | |
| UC51 | Ẩn / hiện danh mục | Danh mục ẩn kéo theo sản phẩm của nó ẩn khỏi menu (BR01) |
| UC52 | Xem danh sách topping | |
| UC53 | Thêm topping mới | Giá ≥ 0 |
| UC54 | Cập nhật tên và giá topping | Đơn cũ không đổi (BR26) |
| UC55 | Khóa / mở bán topping | `Topping.isAvailable` |
| UC56 | Xem danh sách mã khuyến mãi | Mỗi mã kèm cách giảm, hạn dùng, số lượt đã dùng trên tổng lượt, trạng thái (chưa tới hạn, đang dùng, hết lượt, hết hạn, vô hiệu hóa). Lọc theo trạng thái, phân trang (BR47) |
| UC57 | Tạo mã khuyến mãi | `code` duy nhất, `endsAt > startsAt`. Chọn cách giảm: `FIXED` (số tiền giảm), `PERCENT` (1–100 kèm **mức giảm tối đa** bắt buộc) hoặc `FREE_DRINK` (tặng 1 ly, kèm **danh sách món được tặng**, ít nhất 1 món). Đặt `maxTotalUses` (bỏ trống là không giới hạn) và `maxUsesPerUser` (mặc định 1). Quản lý chỉ tạo **mã chung**; mã riêng do hệ thống cấp (BR39) |
| UC58 | Cập nhật mã khuyến mãi | Giới hạn thay đổi khi mã đã dùng (BR48) |
| UC59 | Vô hiệu hóa mã khuyến mãi | Đặt `isActive = false`, đơn cũ không đổi |
| UC60 | Xem danh sách tài khoản khách hàng | Tìm theo số điện thoại hoặc tên, lọc theo vai trò (khách hàng, nhân viên) và trạng thái khóa, phân trang (BR47). Mặc định chỉ hiện khách hàng |
| UC61 | Xem chi tiết tài khoản | Số điện thoại, họ tên, email, vai trò, ngày tạo, trạng thái khóa, điểm, số ly, số dư ví, số đơn và tổng tiền đã chi. **Không** hiện mật khẩu |
| UC62 | Khóa / mở khóa tài khoản | BR17; áp dụng cho cả khách hàng và nhân viên; không tự khóa chính mình → 422 |
| UC63 | Xem điểm tích lũy của khách | Điểm, số ly, số mã thưởng đã nhận và còn dùng được (chỉ xem, không sửa điểm) |
| UC64 | Thống kê doanh thu theo thời gian | Nhóm theo ngày hoặc tháng, BR21. Mặc định 30 ngày gần nhất; kèm tổng doanh thu, số đơn và giá trị đơn trung bình |
| UC65 | Thống kê sản phẩm bán chạy | Theo tổng số ly, BR21. Mặc định 10 món đầu (tối đa 50), mặc định 30 ngày gần nhất |
| UC66 | Thống kê topping được chọn nhiều | Theo tổng số phần đã chọn (số phần × số ly), BR21. Mặc định 10 topping đầu, 30 ngày gần nhất |
| UC67 | Thống kê số đơn theo trạng thái | Đủ 7 trạng thái, kể cả 0, trong khoảng thời gian chọn (mặc định 30 ngày gần nhất) |

Dẫn chiếu: `Sequence-11-QuanTriCRUD` (UC48–UC63, UC69, UC75), `Sequence-12-ThongKe` (UC64–UC67).

## Kế hoạch kiểm thử (theo tiêu chí chấm Task 10 của đề bài)

| # | Kiểm thử | Loại | Kết quả mong đợi | Quy tắc |
|---|---|---|---|---|
| T1 | Chuyển trạng thái sai (ví dụ `PENDING → READY`, `COMPLETED → PAID`, `CANCELLED → PAID`) | unit, `OrdersService.assertTransition` | ném lỗi, trạng thái không đổi | BR12 |
| T2 | Gửi hai lần cùng `Idempotency-Key` tới `POST /payments`, một lần tuần tự và một lần đồng thời | integration | chỉ một `Payment`, đơn `PAID` một lần, lần hai trả lại kết quả cũ | BR10 |
| T3 | Hai (hoặc nhiều) khách đặt đồng thời món chỉ còn 1 ly | integration, chạy song song | đúng một đơn thành công, các đơn còn lại 422, `stockRemaining` không âm | BR49, BR50 |
| T4 | Hủy đơn trước `PREPARING` trả lại số ly, đơn tạo hôm trước thì không cộng vào hôm nay | unit | `stockRemaining` tăng đúng số ly | BR50 |
| T5 | Ngày mới chưa nhập số ly | unit | `remainingToday = 0`, tạo đơn 422 | BR49 |
| T6 | Mã khuyến mãi hợp lệ và không hợp lệ, cộng điểm sau `PAID` | unit | giảm đúng, điểm cộng đúng | BR07, BR11 |
| T7 | Hủy đơn đã `PAID` | unit | điểm và số ly bị trừ đúng `pointsAwarded`, không âm; mã thưởng đã cấp giữ nguyên | BR51 |
| T8 | Hai khách cùng dùng lượt cuối của một mã, hoặc hai yêu cầu rút cùng lúc vượt số dư | integration, chạy song song | đúng một yêu cầu thành công, số dư không âm | BR53 |
