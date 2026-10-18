# 05 · Sequence 13 — Xác thực và phân quyền (xuyên suốt mọi route)

Luồng chung mà **mọi route có JWT** đi qua trước khi vào controller. Không thuộc một UC riêng nhưng quyết định kết quả 401, 403, 404 ở tất cả UC. Quy tắc: BR17, BR18, BR19, BR22, BR30.

## A. Guard xử lý một request

```mermaid
sequenceDiagram
  autonumber
  actor Client as Trang gọi API
  participant JwtAuthGuard
  participant JwtStrategy
  participant TokenRevocationService
  participant UsersService
  participant RolesGuard
  participant Controller as Controller đích
  participant DB

  Client->>JwtAuthGuard: canActivate(context)
  alt Không có token, sai chữ ký, hoặc quá 7 ngày kể từ lúc cấp (BR30)
    JwtAuthGuard-->>Client: 401 Chưa đăng nhập
  else Token hợp lệ
    JwtAuthGuard->>JwtStrategy: validate(payload)
    JwtStrategy->>TokenRevocationService: isRevoked(jti)
    TokenRevocationService->>DB: tìm jti trong danh sách thu hồi
    alt Token đã đăng xuất
      JwtStrategy-->>Client: 401 Phiên đã đăng xuất
    else Chưa bị thu hồi
      JwtStrategy->>UsersService: findById(userId)
      UsersService->>DB: đọc User
      alt Không còn User
        JwtStrategy-->>Client: 401
      else isActive = false
        JwtStrategy-->>Client: 403 Tài khoản bị khóa
      else Hợp lệ
        JwtStrategy-->>JwtAuthGuard: user kèm role
        JwtAuthGuard->>RolesGuard: canActivate(context)
        alt Role không nằm trong danh sách cho phép của route
          RolesGuard-->>Client: 403 Thiếu quyền
        else Được phép
          RolesGuard->>Controller: chuyển request kèm user
        end
      end
    end
  end
```

## A2. Phía giao diện: ẩn hiện menu theo vai trò

Giao diện chỉ **ẩn** chức năng cho gọn, không phải lớp bảo vệ. Bảo vệ thật là các guard ở mục A.

```mermaid
sequenceDiagram
  autonumber
  actor User as Người dùng
  participant AppHeader
  participant AuthStore

  User->>AppHeader: renderMenu()
  AppHeader->>AuthStore: isLoggedIn()
  alt Chưa đăng nhập
    Note over AppHeader: Chỉ hiện Menu, Đăng nhập, Đăng ký. Biểu tượng giỏ hàng bấm vào sẽ yêu cầu đăng nhập
  else Đã đăng nhập
    AppHeader->>AuthStore: getRole()
    alt CUSTOMER
      Note over AppHeader: Thêm Giỏ hàng, Đơn của tôi, Hồ sơ, Điểm, Đăng xuất
    else STAFF
      Note over AppHeader: Thêm trang xử lý đơn và nút khóa mở bán sản phẩm
    else MANAGER
      Note over AppHeader: Thêm toàn bộ trang quản trị
    end
  end
```

## B. Quyền theo nhóm route

Nhìn từ `Class-02-DichVu.md` (cột vai trò). Quản lý kế thừa Nhân viên (G01) nên `MANAGER` làm được mọi thứ `STAFF` làm được.

| Nhóm route | Vai trò cho phép | UC |
|---|---|---|
| `POST /auth/register`, `/auth/verify-otp`, `/auth/resend-otp`, `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `GET /products`, `GET /products/:id`, `GET /categories` | không cần JWT | UC01, UC02, UC68, UC07–UC10 |
| `POST /auth/logout` | mọi người đã đăng nhập | UC03 |
| `/users/me*`, `/orders*`, `POST /payments`, `GET /promotions/validate`, `GET /promotions/mine` | `CUSTOMER` trở lên | UC04–UC06, UC18–UC29, UC70 |
| `/admin/orders*` (kể cả `POST /admin/orders/:id/item-issues`), `GET /admin/feedback` | `STAFF`, `MANAGER` | UC30–UC37, UC74 |
| `/wallet*` | `CUSTOMER` trở lên | UC71, UC72 |
| `/admin/withdrawals*`, `GET /admin/item-issues`, `POST /admin/staff` | `MANAGER` | UC73, UC74, UC75 |
| `PATCH /admin/products/:id/sale-status`, `GET /admin/products` | `STAFF`, `MANAGER` | UC39, UC40 |
| `PUT /admin/products/:id/daily-stock`, `POST /admin/products/daily-stock/reuse` | `MANAGER` | UC76, UC77 |
| Các route `/admin/*` còn lại | `MANAGER` | UC41–UC67, UC69 |

## C. Quyền sở hữu (khác với phân quyền theo vai trò)

Vai trò chưa đủ: khách chỉ được thấy **đơn của mình**. Kiểm trong service, không trong guard.

| Hàm | Kiểm | Sai thì |
|---|---|---|
| `OrdersService.getByUser(userId, orderId)` | `Order.userId = userId` | 404 (không lộ là đơn có tồn tại) |
| `OrdersService.cancelByCustomer`, `FeedbackService.submit` | gọi `getByUser` trước | 404 |
| `PaymentsService.pay` | gọi `OrdersService.getByUser` trước | 404 |
| `/admin/orders*` | không kiểm sở hữu | Nhân viên xem và xử lý mọi đơn |
