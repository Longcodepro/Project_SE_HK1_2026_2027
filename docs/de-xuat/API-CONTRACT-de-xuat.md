# API Contract — BrewLite (BẢN ĐỀ XUẤT, chưa thay `docs/API-CONTRACT.md`)

> Dựng tự động từ `04-class/Class-02-DichVu.md` (bảng route), `Class-04-DTO.md` (DTO, ràng buộc) và `DacTa-UseCase.md` (mã lỗi, quy tắc).
> Chỉ là đề xuất theo thiết kế mới (đăng nhập bằng số điện thoại, ví hoàn tiền, 24 bảng). Muốn dùng thì cả hai bên đồng ý rồi mới thay file `docs/API-CONTRACT.md`.
> Kiểu dữ liệu bảng xem `schema.prisma.de-xuat` cùng thư mục. Khi sửa thiết kế, sửa file `.md` gốc rồi dựng lại bằng `09-doi-chieu/gen_contract.py`.

Base URL: `http://localhost:3001` · Content-Type: `application/json` · Auth: `Authorization: Bearer <jwt>` (JWT sống 7 ngày, đăng xuất thì thu hồi).

Mã lỗi chung: 400 sai dạng dữ liệu (class-validator) · 401 chưa đăng nhập hoặc JWT hết hạn, bị thu hồi · 403 sai vai trò · 404 không thấy · 409 xung đột trạng thái · 422 vi phạm nghiệp vụ. Danh sách phân trang 20 dòng mỗi trang (`?page=`).

## Route

| UC | Route | Vai trò | Body / query | Ghi chú |
|---|---|---|---|---|
| UC01 | `POST /auth/register` | không cần JWT | `RegisterDto` |  |
| UC01 | `POST /auth/verify-otp` | không cần JWT | `VerifyOtpDto` |  |
| UC01, UC02 | `POST /auth/resend-otp` | không cần JWT | `ResendOtpDto` |  |
| UC02 | `POST /auth/login` | không cần JWT | `LoginDto` |  |
| UC68 | `POST /auth/forgot-password` | không cần JWT | `ForgotPasswordDto` |  |
| UC68 | `POST /auth/reset-password` | không cần JWT | `ResetPasswordDto` |  |
| UC03 | `POST /auth/logout` | Khách hàng | không có |  |
| UC04 | `GET /users/me` | Khách hàng | không có |  |
| UC05 | `PATCH /users/me` | Khách hàng | `UpdateProfileDto` |  |
| UC06 | `PATCH /users/me/password` | Khách hàng | `ChangePasswordDto` |  |
| UC07, UC08, UC09 | `GET /products` | không cần JWT | `ProductQuery` | (tham số `search`, `categoryId`) |
| UC07, UC09 | `GET /categories` | không cần JWT | không có |  |
| UC10 | `GET /products/:id` | không cần JWT | không có |  |
| UC18 | `POST /orders` | Khách hàng | `CreateOrderDto` |  |
| UC19 | `GET /promotions/validate` | Khách hàng | `PromoCheckQuery` | (tham số `code`, `subtotal`, `pickedCup`) |
| UC70 | `GET /promotions/mine` | Khách hàng | không có |  |
| UC22, UC23 | `POST /payments` | Khách hàng | `PayDto` | (header `Idempotency-Key`) |
| UC24 | `GET /orders/me` | Khách hàng | không có |  |
| UC25, UC26 | `GET /orders/:id` | Khách hàng | không có |  |
| UC25 | `GET /orders/:id/bill` | Khách hàng | không có |  |
| UC27 | `POST /orders/:id/cancel` | Khách hàng | không có |  |
| UC28 | `POST /orders/:id/feedback` | Khách hàng | `SubmitFeedbackDto` |  |
| UC29 | `GET /users/me/points` | Khách hàng | không có |  |
| UC30, UC31 | `GET /admin/orders` | Nhân viên trở lên | `OrderListQuery` | (tham số `status`) |
| UC32, UC33 | `GET /admin/orders/:id` | Nhân viên trở lên | không có |  |
| UC34 | `PATCH /admin/orders/:id/status` | Nhân viên trở lên | `UpdateStatusDto` |  |
| UC35 | `GET /admin/orders/by-pickup-code/:code` | Nhân viên trở lên | không có |  |
| UC35 | `POST /admin/orders/:id/complete` | Nhân viên trở lên | `CompleteOrderDto` |  |
| UC36 | `POST /admin/orders/:id/cancel` | Nhân viên trở lên | `CancelOrderDto` | (gửi `note` lý do, bắt buộc) |
| UC74 | `POST /admin/orders/:id/item-issues` | Nhân viên trở lên | `HandleMissingItemDto` |  |
| UC74 | `GET /admin/item-issues` | chỉ Quản lý | `ItemIssueQuery` |  |
| UC37 | `GET /admin/feedback` | Nhân viên trở lên | `FeedbackQuery` | (tham số `rating`) |
| UC71 | `GET /wallet` | Khách hàng | không có |  |
| UC72 | `POST /wallet/withdrawals` | Khách hàng | `RequestWithdrawalDto` |  |
| UC72 | `GET /wallet/withdrawals` | Khách hàng | không có |  |
| UC73 | `GET /admin/withdrawals` | chỉ Quản lý | `WithdrawalQuery` |  |
| UC73 | `PATCH /admin/withdrawals/:id/complete` | chỉ Quản lý | `CompleteWithdrawalDto` |  |
| UC73 | `PATCH /admin/withdrawals/:id/reject` | chỉ Quản lý | `RejectWithdrawalDto` |  |
| UC39 | `PATCH /admin/products/:id/sale-status` | Nhân viên trở lên | `SetSaleStatusDto` |  |
| UC40 | `GET /admin/products` | Nhân viên trở lên | không có |  |
| UC41–UC45 | `POST /admin/products` | chỉ Quản lý | không có |  |
| UC46 | `PATCH /admin/products/:id` | chỉ Quản lý | không có |  |
| UC47 | `PATCH /admin/products/:id/lock` | chỉ Quản lý | `SetLockedDto` |  |
| UC76 | `PUT /admin/products/:id/daily-stock` | chỉ Quản lý | `SetDailyStockDto` |  |
| UC77 | `POST /admin/products/daily-stock/reuse` | chỉ Quản lý | không có |  |
| UC48 | `GET /admin/categories` | chỉ Quản lý | không có |  |
| UC49 | `POST /admin/categories` | chỉ Quản lý | không có |  |
| UC50 | `PATCH /admin/categories/:id` | chỉ Quản lý | không có |  |
| UC51 | `PATCH /admin/categories/:id/visibility` | chỉ Quản lý | `SetVisibilityDto` |  |
| UC52 | `GET /admin/toppings` | chỉ Quản lý | không có |  |
| UC53 | `POST /admin/toppings` | chỉ Quản lý | không có |  |
| UC54 | `PATCH /admin/toppings/:id` | chỉ Quản lý | không có |  |
| UC55 | `PATCH /admin/toppings/:id/availability` | chỉ Quản lý | `SetAvailabilityDto` |  |
| UC56 | `GET /admin/promotions` | chỉ Quản lý | không có |  |
| UC57 | `POST /admin/promotions` | chỉ Quản lý | không có |  |
| UC58 | `PATCH /admin/promotions/:id` | chỉ Quản lý | không có |  |
| UC59 | `PATCH /admin/promotions/:id/deactivate` | chỉ Quản lý | không có |  |
| UC60 | `GET /admin/users` | chỉ Quản lý | không có |  |
| UC61 | `GET /admin/users/:id` | chỉ Quản lý | không có |  |
| UC62 | `PATCH /admin/users/:id/active` | chỉ Quản lý | không có |  |
| UC63 | `GET /admin/users/:id/points` | chỉ Quản lý | không có |  |
| UC75 | `POST /admin/staff` | chỉ Quản lý | `CreateStaffDto` |  |
| UC69 | `GET /admin/loyalty/settings` | chỉ Quản lý | không có |  |
| UC69 | `PATCH /admin/loyalty/settings` | chỉ Quản lý | `UpdateLoyaltySettingsDto` |  |
| UC69 | `GET /admin/loyalty/rules` | chỉ Quản lý | không có |  |
| UC69 | `POST /admin/loyalty/rules` | chỉ Quản lý | `CreateRewardRuleDto` |  |
| UC69 | `PATCH /admin/loyalty/rules/:id` | chỉ Quản lý | `UpdateRewardRuleDto` |  |
| UC69 | `PATCH /admin/loyalty/rules/:id/active` | chỉ Quản lý | `SetActiveDto` |  |
| UC64 | `GET /admin/stats/revenue` | chỉ Quản lý | không có |  |
| UC65 | `GET /admin/stats/top-products` | chỉ Quản lý | không có |  |
| UC66 | `GET /admin/stats/top-toppings` | chỉ Quản lý | không có |  |
| UC67 | `GET /admin/stats/orders-by-status` | chỉ Quản lý | không có |  |

Tổng: 72 route.

## DTO

Mỗi dòng là `kiểu tên`. Ràng buộc từng trường xem bảng ở cuối.

### RegisterDto
```
string phone
string password
string fullName
string email
```

### VerifyOtpDto
```
string phone
string code
```

### ResendOtpDto
```
string phone
```

### ForgotPasswordDto
```
string phone
```

### ResetPasswordDto
```
string phone
string code
string newPassword
```

### LoginDto
```
string phone
string password
```

### UpdateProfileDto
```
string fullName
string email
```

### ChangePasswordDto
```
string oldPassword
string newPassword
```

### AuthResult
```
string token
User user
```

### ProductQuery
```
string search
int categoryId
```

### ProductSizeInput
```
SizeCode sizeCode
int price
int volumeMl
```

### CreateProductDto
```
int categoryId
string name
string description
string imageUrl
List~ProductSizeInput~ sizes
List~int~ toppingIds
int maxPerTopping
int maxToppingTotal
boolean allowHot
boolean allowCold
Temperature defaultTemperature
int iceMin
int iceMax
int iceDefault
int sugarMin
int sugarMax
int sugarDefault
```

### UpdateProductDto
```
int categoryId
string name
string description
string imageUrl
List~ProductSizeInput~ sizes
List~int~ toppingIds
int maxPerTopping
int maxToppingTotal
boolean allowHot
boolean allowCold
Temperature defaultTemperature
int iceMin
int iceMax
int iceDefault
int sugarMin
int sugarMax
int sugarDefault
```

### SetVisibilityDto
```
boolean isVisible
```

### SetAvailabilityDto
```
boolean isAvailable
```

### SetSaleStatusDto
```
ProductStatus status
```

### SetDailyStockDto
```
int quantity
```

### SetLockedDto
```
boolean isLocked
```

### SetActiveDto
```
boolean isActive
```

### CreateCategoryDto
```
string name
```

### UpdateCategoryDto
```
string name
```

### CreateToppingDto
```
string name
int price
```

### UpdateToppingDto
```
string name
int price
```

### CreatePromotionDto
```
string code
DiscountType discountType
int discountValue
int maxDiscountAmount
int minOrderAmount
int maxTotalUses
int maxUsesPerUser
List~int~ productIds
datetime startsAt
datetime endsAt
```

### UpdatePromotionDto
```
DiscountType discountType
int discountValue
int maxDiscountAmount
int minOrderAmount
int maxTotalUses
int maxUsesPerUser
datetime startsAt
datetime endsAt
boolean isActive
```

### PromoCheckQuery
```
string code
int subtotal
int pickedCup
```

### MyVoucherView
```
string code
PromotionScope scope
string label
datetime expiresAt
boolean isUsable
```

### UpdateLoyaltySettingsDto
```
int amountStep
int pointsPerStep
```

### CreateRewardRuleDto
```
string name
RewardKind kind
int threshold
DiscountType discountType
int discountValue
int maxDiscountAmount
int minOrderAmount
int validDays
List~int~ productIds
```

### UpdateRewardRuleDto
```
string name
int threshold
DiscountType discountType
int discountValue
int maxDiscountAmount
int minOrderAmount
int validDays
```

### ValidatedPromotion
```
Promotion promotion
int discountAmount
```

### OrderLineDto
```
int productId
SizeCode sizeCode
int iceLevel
int sugarLevel
Temperature temperature
string note
int quantity
List~OrderToppingDto~ toppings
```

### OrderToppingDto
```
int toppingId
int quantity
```

### CreateOrderDto
```
List~OrderLineDto~ items
string promotionCode
int freeCupLine
```

### OrderListQuery
```
OrderStatus status
```

### UpdateStatusDto
```
OrderStatus status
```

### CompleteOrderDto
```
string pickupCode
```

### CancelOrderDto
```
string note
```

### HandleMissingItemDto
```
int orderItemId
int quantity
ItemResolution resolution
string note
```

### ItemIssueQuery
```
datetime from
datetime to
ItemResolution resolution
```

### RequestWithdrawalDto
```
int amount
DestinationType destinationType
string accountName
string accountNumber
string bankName
```

### WithdrawalQuery
```
WithdrawalStatus status
```

### CompleteWithdrawalDto
```
string transferRef
```

### RejectWithdrawalDto
```
string rejectReason
```

### WalletView
```
int balance
List~WalletTransaction~ transactions
```

### SubmitFeedbackDto
```
int rating
string comment
```

### FeedbackQuery
```
int rating
```

### PayDto
```
int orderId
PaymentMethod method
CardInput card
```

### CardInput
```
string number
string holderName
string expiry
string cvv
```

### PaymentResult
```
Payment payment
Order order
```

### GatewayResult
```
boolean success
string gatewayRef
```

### BillView
```
string orderCode
datetime paidAt
string customerName
string phoneMasked
PaymentMethod paymentMethod
string transactionCode
List~BillLine~ lines
int subtotal
int discountAmount
string promotionCode
string promotionLabel
int totalAmount
int pointsEarned
List~int~ refundAmounts
int netAmount
boolean isCancelled
```

### BillLine
```
int quantity
string productName
string sizeLabel
int unitPrice
int lineTotal
string optionsText
string toppingsText
string note
```

### UserListQuery
```
string search
Role role
boolean isActive
int page
int pageSize
```

### CreateStaffDto
```
string phone
string fullName
string password
string email
```

### StatsQuery
```
datetime from
datetime to
string groupBy
int limit
```

## Ràng buộc validate

| DTO.trường | Ràng buộc | Lỗi | Quy tắc |
|---|---|---|---|
| RegisterDto.phone, VerifyOtpDto.phone, ResendOtpDto.phone, LoginDto.phone, ForgotPasswordDto.phone, ResetPasswordDto.phone | **bắt buộc**, đúng 10 chữ số, bắt đầu bằng 0 | 400 | BR22 |
| RegisterDto.email, UpdateProfileDto.email | **tùy chọn**, nếu có thì là email hợp lệ, tối đa 255, lưu chữ thường | 400 | BR22 |
| RegisterDto.password, ChangePasswordDto.newPassword, ResetPasswordDto.newPassword | chuỗi, tối thiểu 8 ký tự | 400 | BR22 |
| RegisterDto.fullName, UpdateProfileDto.fullName | không rỗng, tối đa 100 | 400 | |
| VerifyOtpDto.code, ResetPasswordDto.code | đúng 6 chữ số | 400 (sai dạng), 422 (sai mã, hết hạn, quá 5 lần) | BR27 |
| SetDailyStockDto.quantity | số nguyên từ 0 đến 9999 | 400 | BR49 |
| SetSaleStatusDto.status | chỉ `ON_SALE` hoặc `SOLD_OUT`; món đang `LOCKED` thì không đổi được | 400, 409 | BR02, BR33 |
| ProductSizeInput.sizeCode | thuộc `S`, `M`, `L`, không trùng trong một sản phẩm | 400 | G09 |
| ProductSizeInput.price, CreateToppingDto.price | số nguyên ≥ 0 | 400 | |
| ProductSizeInput.volumeMl | **tùy chọn**; nếu có là số nguyên từ 1 đến 2000 (ml) | 400 | BR34 |
| CreateProductDto.sizes | ít nhất 1 phần tử | 400 | UC42 |
| CreateProductDto.toppingIds | mỗi id phải tồn tại | 404 | UC43 |
| CreateProductDto.maxPerTopping, maxToppingTotal | Món có topping: `1 ≤ maxPerTopping ≤ maxToppingTotal ≤ 10`. Món không có topping: cả hai bằng 0 | 400 | UC43, BR37 |
| CreateProductDto.allowHot, allowCold, defaultTemperature | ít nhất một trong `allowHot`, `allowCold` là `true`; `defaultTemperature` phải thuộc nhiệt độ được phép | 400 | BR35 |
| CreateProductDto.iceMin, iceMax, iceDefault, sugarMin, sugarMax, sugarDefault | `0 ≤ min ≤ default ≤ max ≤ 100` | 400 | UC44, UC45, BR04 |
| CreatePromotionDto.code | không rỗng, tối đa 50, lưu chữ hoa, duy nhất | 400, 409 | |
| CreatePromotionDto.discountValue | > 0; `PERCENT` thì từ 1 đến 100 | 400 | BR07 |
| CreatePromotionDto.maxDiscountAmount | `PERCENT`: **bắt buộc**, số nguyên > 0 (đồng). `FREE_DRINK`: tùy chọn. `FIXED`: phải để trống | 400 | BR07 |
| CreatePromotionDto.discountType | `PERCENT`, `FIXED` hoặc `FREE_DRINK`. `FREE_DRINK` thì không có `discountValue` | 400 | BR07 |
| CreatePromotionDto.maxTotalUses | tùy chọn; bỏ trống là không giới hạn tổng lượt; nếu có là số nguyên ≥ 1 | 400 | BR39 |
| CreatePromotionDto.maxUsesPerUser | số nguyên ≥ 1, mặc định 1 | 400 | BR39 |
| PromoCheckQuery.pickedCup | tùy chọn; số thứ tự dòng trong giỏ mà khách chọn làm ly được tặng. **Bắt buộc với mã `FREE_DRINK`**, dòng đó phải thuộc danh sách món của mã (xem trước) | 400, 422 | BR07 |
| CreateOrderDto.freeCupLine | tùy chọn; dòng khách chọn làm ly được tặng, bắt buộc khi đơn dùng mã `FREE_DRINK`; món của dòng phải thuộc danh sách của mã | 422 | BR07 |
| CreatePromotionDto.productIds | bắt buộc ít nhất 1 món khi `discountType = FREE_DRINK`, mỗi id phải tồn tại; các loại khác để trống | 400, 404 | BR07 |
| CreateRewardRuleDto.productIds | bắt buộc ít nhất 1 món khi loại mã thưởng là `FREE_DRINK` | 400, 404 | BR40 |
| UpdateLoyaltySettingsDto.amountStep | số nguyên ≥ 1000 (đồng) | 400 | BR11 |
| UpdateLoyaltySettingsDto.pointsPerStep | số nguyên ≥ 1 | 400 | BR11 |
| CreateRewardRuleDto.kind | `POINTS` hoặc `CUPS` | 400 | BR40 |
| CreateRewardRuleDto.threshold | số nguyên ≥ 1 (cứ mỗi bấy nhiêu điểm hoặc ly) | 400 | BR40 |
| CreateRewardRuleDto.discountType, discountValue, maxDiscountAmount | cùng quy tắc như mã khuyến mãi (xem trên) | 400 | BR07, BR40 |
| CreateRewardRuleDto.validDays | số nguyên từ 1 đến 365 | 400 | BR40 |
| CreatePromotionDto.endsAt | sau `startsAt` | 400 | |
| OrderLineDto.quantity | số nguyên từ 1 đến 20 | 400 | BR52 |
| OrderLineDto.iceLevel, sugarLevel | số nguyên, trong min–max của sản phẩm | 422 | BR04 |
| OrderLineDto.temperature | `HOT` hoặc `COLD`, phải được món cho phép (`allowHot`, `allowCold`) | 422 | BR35 |
| OrderLineDto.iceLevel khi `temperature = HOT` | phải bằng 0 | 422 | BR35 |
| OrderLineDto.note | **tùy chọn**, tối đa **20 từ** (tách theo khoảng trắng) và không quá 200 ký tự, văn bản thuần, cắt khoảng trắng đầu cuối | 400 | BR36 |
| OrderToppingDto.toppingId | thuộc topping của sản phẩm và đang bán, không trùng trong một dòng | 422 | BR05 |
| OrderToppingDto.quantity | số nguyên ≥ 1 và ≤ `maxPerTopping` của món | 422 | BR37 |
| OrderLineDto.toppings | tổng `quantity` các topping ≤ `maxToppingTotal` của món | 422 | BR37 |
| CreateOrderDto.items | ít nhất 1 phần tử | 400 | |
| CreateOrderDto.promotionCode | tùy chọn, hợp lệ theo `PromotionsService.validateCode` | 422 | BR07 |
| UpdateStatusDto.status | chỉ `PREPARING` hoặc `READY` | 409 nếu ngoài luồng | BR12 |
| CancelOrderDto.note | **bắt buộc khi nhân viên hủy**, từ 5 đến 200 ký tự; khi khách tự hủy thì tùy chọn | 400 | BR13 |
| HandleMissingItemDto.orderItemId, quantity | dòng thuộc đơn; `quantity` từ 1 đến số ly còn lại chưa xử lý của dòng | 422 | BR45 |
| HandleMissingItemDto.resolution | `REFUND_TO_WALLET` hoặc `EXCHANGE` | 400 | BR45 |
| HandleMissingItemDto.note | **bắt buộc**, từ 5 đến 200 ký tự | 400 | BR45 |
| RequestWithdrawalDto.amount | số nguyên từ 10.000 đến số dư ví | 400, 422 | BR44 |
| RequestWithdrawalDto.destinationType | `EWALLET`, `CARD` hoặc `BANK` | 400 | BR44 |
| RequestWithdrawalDto.accountName, accountNumber | bắt buộc, tên tối đa 100 ký tự, số tối đa 30 ký tự | 400 | BR44 |
| RequestWithdrawalDto.bankName | bắt buộc khi `destinationType` là `CARD` hoặc `BANK` | 400 | BR44 |
| CompleteWithdrawalDto.transferRef | bắt buộc, mã giao dịch chuyển thủ công, tối đa 50 ký tự | 400 | BR44 |
| RejectWithdrawalDto.rejectReason | bắt buộc, từ 5 đến 200 ký tự | 400 | BR44 |
| CreateStaffDto.phone | bắt buộc, 10 chữ số bắt đầu bằng 0, chưa ai dùng (trùng 409) | 400, 409 | BR46 |
| CreateStaffDto.password | bắt buộc, tối thiểu 8 ký tự | 400 | BR46 |
| CreateStaffDto.fullName | bắt buộc, tối đa 100 ký tự | 400 | BR46 |
| UserListQuery.role | tùy chọn: `CUSTOMER`, `STAFF`, `MANAGER` | 400 | UC60 |
| Mọi query danh sách (`page`, `pageSize`) | `page` ≥ 1, `pageSize` từ 1 đến 50, mặc định 20 | 400 | BR47 |
| ChangePasswordDto.oldPassword | bắt buộc, chuỗi không rỗng | 400 | BR22 |
| ProductQuery.search | tùy chọn, tối đa 50 ký tự | 400 | BR32 |
| ProductQuery.categoryId | tùy chọn, số nguyên, danh mục phải đang hiện | 400 | BR01 |
| CreateProductDto.categoryId | bắt buộc, danh mục tồn tại | 400, 404 | UC41 |
| CreateProductDto.name | bắt buộc, 1 đến 150 ký tự | 400 | UC41 |
| CreateProductDto.description, imageUrl | tùy chọn, mô tả tối đa 1000 ký tự, đường dẫn ảnh tối đa 500 ký tự | 400 | UC41 |
| UpdateProductDto (mọi trường) | tùy chọn, cùng ràng buộc như `CreateProductDto`; danh sách `sizes` và `toppingIds` nếu gửi thì thay thế toàn bộ | 400, 404 | UC46 |
| SetVisibilityDto.isVisible, SetAvailabilityDto.isAvailable, SetLockedDto.isLocked, SetActiveDto.isActive | bắt buộc, kiểu boolean | 400 | UC47, UC51, UC55, UC62 |
| CreateCategoryDto.name, UpdateCategoryDto.name | bắt buộc, 1 đến 100 ký tự, không trùng danh mục khác | 400, 409 | UC49, UC50 |
| CreateToppingDto.name, UpdateToppingDto.name | bắt buộc, 1 đến 100 ký tự, không trùng topping khác | 400, 409 | UC53, UC54 |
| CreatePromotionDto.minOrderAmount | số nguyên ≥ 0, mặc định 0 | 400 | BR07 |
| UpdatePromotionDto.minOrderAmount, isActive | tùy chọn; số nguyên ≥ 0 và boolean. Khi mã đã dùng chỉ đổi được hạn, tổng lượt, số lần mỗi khách, đơn tối thiểu, bật tắt (BR48) | 400, 409 | BR48 |
| PromoCheckQuery.subtotal | bắt buộc, số nguyên ≥ 0 (tạm tính của đơn) | 400 | BR07 |
| CreateRewardRuleDto.name, UpdateRewardRuleDto.name | bắt buộc, 1 đến 100 ký tự | 400 | BR40 |
| CreateRewardRuleDto.minOrderAmount, UpdateRewardRuleDto.minOrderAmount | số nguyên ≥ 0, mặc định 0 | 400 | BR40 |
| CompleteOrderDto.pickupCode | đúng 6 chữ số, phải khớp mã của đơn | 400, 422 | BR12 |
| UserListQuery.search | tùy chọn, tối đa 50 ký tự, tìm theo số điện thoại hoặc tên | 400 | UC60 |
| UserListQuery.isActive | tùy chọn, boolean | 400 | UC60 |
| StatsQuery.limit | tùy chọn, số nguyên từ 1 đến 50, mặc định 10 | 400 | UC65, UC66 |
| SubmitFeedbackDto.rating | số nguyên từ 1 đến 5 | 400 | BR14 |
| SubmitFeedbackDto.comment | tùy chọn, tối đa 50 từ và không quá 300 ký tự, văn bản thuần | 400 | BR14 |
| FeedbackQuery.rating | tùy chọn, số nguyên từ 1 đến 5 | 400 | BR14 |
| PayDto.orderId | số nguyên, đơn thuộc khách | 400, 404 | BR09 |
| PayDto.method | `EWALLET`, `CARD` hoặc `TRANSFER` | 400 | BR41 |
| PayDto.card | **bắt buộc khi `method = CARD`**, các trường dưới đây; không lưu, không ghi log | 400 | BR41 |
| CardInput.number | đúng 16 chữ số | 400 | BR41 |
| CardInput.holderName | tùy chọn, chữ không dấu, tối đa 50 ký tự | 400 | BR41 |
| CardInput.expiry | dạng MM/YY, phải còn hạn | 400 | BR41 |
| CardInput.cvv | đúng 3 chữ số | 400 | BR41 |
| Header `Idempotency-Key` | bắt buộc ở `POST /payments`, tối đa 100 ký tự | 400 | BR10 |
| StatsQuery.groupBy | `day` hoặc `month` | 400 | UC64 |
| StatsQuery.from, to | `from` không sau `to` | 400 | UC64 |
| OrderListQuery.status | thuộc enum `OrderStatus` | 400 | UC31 |
