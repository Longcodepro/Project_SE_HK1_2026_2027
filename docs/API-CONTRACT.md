# API Contract — BrewLite

> Hợp đồng giữa frontend và backend, **khớp với code backend hiện tại** (72 route nghiệp vụ + `GET /` và `GET /health`).
> Muốn đổi: báo người kia, sửa file này cùng lúc với code, và cập nhật case Postman tương ứng.
> Chi tiết từng trường của body/query xem Swagger tại `http://localhost:3001/api` (sinh tự động từ code, luôn đúng). Ví dụ gọi thật xem `backend/postman/cases/`.

Base URL `http://localhost:3001` · `Content-Type: application/json` · Auth `Authorization: Bearer <jwt>`.

JWT sống 7 ngày, mỗi thẻ có `jti` riêng; `POST /auth/logout` thu hồi đúng thẻ đang dùng.

## Quy ước chung

**Mã lỗi** (body lỗi luôn có `statusCode` và `message`):

| Mã | Khi nào |
|---|---|
| 400 | Dữ liệu sai dạng (class-validator): thiếu trường, sai kiểu, ngoài khoảng, sai định dạng |
| 401 | Chưa đăng nhập, token sai / hết hạn / đã đăng xuất, sai mật khẩu |
| 403 | Sai vai trò, tài khoản bị khóa, tài khoản chưa xác thực OTP |
| 404 | Không có bản ghi. Đơn của người khác cũng trả 404 để không lộ sự tồn tại |
| 409 | Xung đột trạng thái (đổi trạng thái sai thứ tự, đã xử lý rồi) hoặc trùng khóa duy nhất |
| 422 | Dữ liệu đúng dạng nhưng vi phạm quy tắc nghiệp vụ (hết hàng, mã khuyến mãi không dùng được, ...) |

**Vai trò:** `CUSTOMER` (khách), `STAFF` (nhân viên), `MANAGER` (quản lý). "Nhân viên trở lên" là STAFF và MANAGER.

**Phân trang** (mọi danh sách quản trị): `?page=1&pageSize=20` (`pageSize` 1–50, mặc định 20). Trả `{ items, total, page, pageSize }`. Danh sách của khách (`/orders/me`, `/wallet`, `/wallet/withdrawals`, `/promotions/mine`) là mảng thuần, mới nhất trước.

**Tiền** là số nguyên đồng (VND). **Giờ** trả về dạng ISO 8601 UTC; "ngày" của quán tính theo giờ Việt Nam (UTC+7).

**Tài khoản mẫu** (sau `npm run seed`, mật khẩu chung `Brew@1234`): quản lý `0900000001`, nhân viên `0911000001`, khách `0922000001`. OTP dev luôn là `123456`.

## Route

### Xác thực — không cần JWT (trừ logout)

| Route | Mô tả |
|---|---|
| `POST /auth/register` | Đăng ký (`phone`, `password`, `fullName`, `email?`), gửi OTP. Chưa trả token |
| `POST /auth/verify-otp` | Xác thực OTP đăng ký → `{ token, user }` |
| `POST /auth/resend-otp` | Gửi lại OTP (cách nhau ≥ 60 giây, sớm hơn → 422) |
| `POST /auth/login` | Đăng nhập → `{ token, user }`. Chưa xác thực OTP hoặc bị khóa → 403 |
| `POST /auth/forgot-password` | Xin OTP đặt lại mật khẩu. Luôn trả lời giống nhau dù số có tài khoản hay không |
| `POST /auth/reset-password` | Đặt lại mật khẩu bằng OTP |
| `POST /auth/logout` | (mọi vai trò) Thu hồi token đang dùng |

### Hồ sơ — mọi vai trò đã đăng nhập

| Route | Mô tả |
|---|---|
| `GET /users/me` | Hồ sơ, điểm, số ly, số dư ví |
| `PATCH /users/me` | Sửa `fullName`, `email` (gửi `null` để xóa email). Số điện thoại không đổi được |
| `PATCH /users/me/password` | Đổi mật khẩu (`oldPassword`, `newPassword`). Mật khẩu cũ sai → 401 |
| `GET /users/me/points` | (khách) Điểm, số ly, còn thiếu bao nhiêu tới mốc thưởng kế tiếp |

### Thực đơn — công khai

| Route | Mô tả |
|---|---|
| `GET /categories` | Danh mục đang hiện |
| `GET /products?search=&categoryId=` | Menu. Giữ cả món hết bán / hết ly (mờ), bỏ món khóa bán và danh mục ẩn. `categoryId` ẩn hoặc không có → 400 |
| `GET /products/:id` | Chi tiết: size + giá + ml, đá/đường min-max-mặc định, topping đang bán, `remainingToday`, `orderable`. Món khóa bán hoặc danh mục ẩn → 404 |

### Khuyến mãi — khách

| Route | Mô tả |
|---|---|
| `GET /promotions/validate?code=&subtotal=` | Xem trước mã. Với mã tặng ly thêm `pickedCup` (thứ tự dòng, **bắt đầu từ 0**), tùy chọn `pickedProductId`, `cupPrice` để xem trước số tiền giảm. Không dùng được → 422 |
| `GET /promotions/mine` | Mã riêng của tôi + mã chung còn hiệu lực, kèm `label`, `expiresAt`, `isUsable` |

### Đơn hàng và thanh toán — khách

| Route | Mô tả |
|---|---|
| `POST /orders` | Tạo đơn `{ items[], promotionCode?, freeCupLine? }` (`freeCupLine` bắt đầu từ 0). Mỗi dòng: `productId`, `sizeCode`, `iceLevel`, `sugarLevel`, `temperature`, `quantity` 1–20, `note?` (≤ 20 từ), `toppings?[{ toppingId, quantity }]`. Server tự tính lại giá, trừ số ly trong ngày |
| `GET /orders/me` | Lịch sử đơn |
| `GET /orders/:id` | Chi tiết. `pickupCode` chỉ có khi đơn `READY` |
| `GET /orders/:id/bill` | Hóa đơn. Đơn chưa thanh toán → 409 |
| `POST /orders/:id/cancel` | Hủy khi `PENDING`, `PAYMENT_FAILED`, `PAID`. Đã trả tiền thì hoàn vào ví và thu hồi điểm. Từ `PREPARING` → 409 |
| `POST /orders/:id/feedback` | Đánh giá 1–5 sao cho đơn `COMPLETED`, mỗi đơn một lần |
| `POST /payments` | Thanh toán `{ orderId, method: EWALLET\|CARD\|TRANSFER, card? }`. **Bắt buộc header `Idempotency-Key`** (≤ 100 ký tự). Cùng khóa → trả kết quả cũ, không trừ tiền lần nữa. Trả `{ payment, order }`; thẻ bị từ chối vẫn trả 201 với `payment.status = FAILED` và `order.status = PAYMENT_FAILED` |

Thẻ thử: `4111 1111 1111 1111` luôn thành công, `4000 0000 0000 0002` luôn bị từ chối.

### Ví hoàn tiền — khách

| Route | Mô tả |
|---|---|
| `GET /wallet` | `{ balance, transactions[] }`. Ví chỉ nhận tiền hoàn, không dùng để thanh toán |
| `POST /wallet/withdrawals` | Yêu cầu rút (≥ 10.000đ). Trừ ví ngay. `bankName` bắt buộc với `CARD`/`BANK`. Vượt số dư → 422 |
| `GET /wallet/withdrawals` | Các yêu cầu rút của tôi |

### Vận hành đơn — nhân viên trở lên

| Route | Mô tả |
|---|---|
| `GET /admin/orders?status=` | Danh sách đơn, mới nhất trước |
| `GET /admin/orders/:id` | Chi tiết kèm khách, thanh toán, hoàn tiền, người hủy |
| `GET /admin/orders/by-pickup-code/:code` | Tra đơn theo mã nhận hàng |
| `PATCH /admin/orders/:id/status` | `{ status: PREPARING\|READY }`. `READY` sinh `pickupCode` và báo khách. Sai thứ tự hoặc đích khác → 409 |
| `POST /admin/orders/:id/complete` | `{ pickupCode }` giao món → `COMPLETED`. Đơn chưa `READY` → 409, mã sai → 422 |
| `POST /admin/orders/:id/cancel` | `{ note }` **bắt buộc** 5–200 ký tự |
| `POST /admin/orders/:id/item-issues` | Món không làm được: `{ orderItemId, quantity, resolution: REFUND_TO_WALLET\|EXCHANGE, note }` |
| `GET /admin/feedback?rating=` | Phản hồi dịch vụ |
| `GET /admin/products` | Danh sách món kèm `dailyQuota`, `remainingToday` (cả món khóa) |
| `PATCH /admin/products/:id/sale-status` | `{ status: ON_SALE\|SOLD_OUT }`. Món đang khóa → 409 |

### Quản trị — chỉ quản lý

| Nhóm | Route |
|---|---|
| Sản phẩm | `POST /admin/products` · `PATCH /admin/products/:id` · `PATCH /admin/products/:id/lock` · `PUT /admin/products/:id/daily-stock` · `POST /admin/products/daily-stock/reuse` |
| Danh mục | `GET/POST /admin/categories` · `PATCH /admin/categories/:id` · `PATCH /admin/categories/:id/visibility` |
| Topping | `GET/POST /admin/toppings` · `PATCH /admin/toppings/:id` · `PATCH /admin/toppings/:id/availability` |
| Khuyến mãi | `GET/POST /admin/promotions` · `PATCH /admin/promotions/:id` · `PATCH /admin/promotions/:id/deactivate` |
| Tích điểm | `GET/PATCH /admin/loyalty/settings` · `GET/POST /admin/loyalty/rules` · `PATCH /admin/loyalty/rules/:id` · `PATCH /admin/loyalty/rules/:id/active` |
| Tài khoản | `GET /admin/users` · `GET /admin/users/:id` · `PATCH /admin/users/:id/active` · `GET /admin/users/:id/points` · `POST /admin/staff` |
| Rút tiền | `GET /admin/withdrawals?status=` · `PATCH /admin/withdrawals/:id/complete` (`transferRef`) · `PATCH /admin/withdrawals/:id/reject` (`rejectReason`) |
| Món không làm được | `GET /admin/item-issues?from=&to=&resolution=` |
| Thống kê | `GET /admin/stats/revenue` · `top-products` · `top-toppings` · `orders-by-status` (query `from`, `to`, `groupBy=day\|month`, `limit`) |

## Luồng trạng thái đơn

```
PENDING ──thanh toán──▶ PAID ──▶ PREPARING ──▶ READY ──(nhập mã nhận hàng)──▶ COMPLETED
   │  ▲                  │
   ▼  │                  │
PAYMENT_FAILED           │
   │                     │
   └───────hủy───────────┴──▶ CANCELLED      (chỉ hủy được khi PENDING, PAYMENT_FAILED, PAID)
```

## Khác với bản thiết kế ban đầu

Các điểm sau là quyết định khi hiện thực, cần cả hai bên biết:

- `GET /promotions/validate` có thêm `pickedProductId` và `cupPrice` (tùy chọn), vì server không biết nội dung giỏ khi xem trước mã tặng ly. Bước kiểm chính thức vẫn nằm ở `POST /orders` với `freeCupLine`.
- Thứ tự dòng (`pickedCup`, `freeCupLine`) bắt đầu từ **0**.
- `POST /admin/products/daily-stock/reuse` và các `POST` không tạo bản ghi (`cancel`, `complete`, `verify-otp`, `login`...) trả **200**, không phải 201.
- Hủy đơn đã trả tiền chỉ hoàn **phần chưa hoàn** (đơn đã hoàn tiền một số món ở UC74 thì không hoàn thừa).
- OTP dev cố định `123456`; đặt `OTP_RANDOM=true` để sinh ngẫu nhiên (SMS chỉ ghi log vì chưa có cổng SMS thật).
- Chuyển khoản giả lập tự xác nhận sau khoảng 1,5 giây (`MOCK_TRANSFER_DELAY_MS`).
