# 05 · Sequence 01 — Tài khoản (UC01–UC06, UC68)

Phủ: UC01 Đăng ký (gồm xác thực OTP), UC02 Đăng nhập, UC03 Đăng xuất, UC04 Xem thông tin, UC05 Cập nhật thông tin, UC06 Đổi mật khẩu, UC68 Quên mật khẩu (mục F). Quy tắc: BR17, BR19, BR22, BR27, BR31. Số điện thoại là bắt buộc và là tên đăng nhập; email tùy chọn. Tên hàm theo `04-class/Class-02-DichVu.md` và `Class-03-GiaoDien.md`.

## A. Đăng ký (UC01), bước 1: tạo tài khoản và gửi OTP

```mermaid
sequenceDiagram
  autonumber
  actor Guest as Khách vãng lai
  participant RegisterPage
  participant VerifyOtpPage
  participant AuthController
  participant AuthService
  participant UsersService
  participant OtpService
  participant SmsGateway
  participant DB

  Guest->>RegisterPage: submit(form)
  RegisterPage->>AuthController: POST /auth/register
  AuthController->>AuthService: register(dto)
  AuthService->>UsersService: findByPhone(phone)
  UsersService->>DB: tìm user theo số điện thoại
  alt Số điện thoại đã đăng ký
    AuthService-->>RegisterPage: 409 Số điện thoại đã được dùng
  else Số điện thoại mới
    opt Khách có điền email
      AuthService->>UsersService: findByEmail(email)
      UsersService->>DB: tìm user theo email
      alt Email đã được dùng
        AuthService-->>RegisterPage: 409 Email đã được dùng
      end
    end
    AuthService->>UsersService: create(data)
    UsersService->>DB: lưu User role CUSTOMER, isPhoneVerified = false, mật khẩu băm bcrypt
    AuthService->>OtpService: sendOtp(phone, purpose)
    OtpService->>OtpService: generateCode()
    OtpService->>DB: lưu OtpCode (băm), hạn 5 phút
    OtpService->>SmsGateway: send(phone, content)
    AuthService-->>RegisterPage: 201 chưa có token, chờ xác thực OTP
    RegisterPage->>VerifyOtpPage: load(phone)
  end
```

## B. Đăng ký (UC01), bước 2: nhập OTP

```mermaid
sequenceDiagram
  autonumber
  actor Guest as Khách vãng lai
  participant VerifyOtpPage
  participant AuthStore
  participant CartStore
  participant AuthController
  participant AuthService
  participant UsersService
  participant OtpService
  participant SmsGateway
  participant DB

  Guest->>VerifyOtpPage: submit(form)
  VerifyOtpPage->>AuthController: POST /auth/verify-otp
  AuthController->>AuthService: verifyOtp(dto)
  AuthService->>OtpService: verifyOtp(phone, code, purpose)
  OtpService->>DB: đọc OtpCode mới nhất chưa dùng
  alt Sai mã, hết hạn, hoặc đã nhập sai 5 lần
    OtpService-->>VerifyOtpPage: 422 OTP không hợp lệ
  else Đúng mã
    OtpService->>DB: đánh dấu OtpCode đã dùng
    AuthService->>UsersService: markPhoneVerified(phone)
    UsersService->>DB: isPhoneVerified = true
    AuthService->>AuthService: issueToken(user)
    AuthService-->>VerifyOtpPage: 200 token và user
    VerifyOtpPage->>AuthStore: setSession(token, user)
    VerifyOtpPage->>CartStore: loadForUser(userId)
    VerifyOtpPage->>CartStore: applyPending()
    Note over CartStore: Nếu khách vừa bấm Thêm vào giỏ lúc chưa đăng nhập thì món đó được thêm vào giỏ (BR29)
  end

  opt Không nhận được mã, bấm gửi lại
    Guest->>VerifyOtpPage: onResend()
    VerifyOtpPage->>AuthController: POST /auth/resend-otp
    AuthController->>AuthService: resendOtp(dto)
    AuthService->>OtpService: sendOtp(phone, purpose)
    alt Gửi lại trong vòng 60 giây
      OtpService-->>VerifyOtpPage: 422 Chờ một lát rồi thử lại
    else Được phép
      OtpService->>SmsGateway: send(phone, content)
      OtpService-->>VerifyOtpPage: 200 đã gửi mã mới
    end
  end
```

## C. Đăng nhập (UC02)

```mermaid
sequenceDiagram
  autonumber
  actor Guest as Khách vãng lai
  participant LoginPage
  participant VerifyOtpPage
  participant AuthStore
  participant CartStore
  participant AuthController
  participant AuthService
  participant UsersService
  participant DB

  Guest->>LoginPage: submit(form)
  LoginPage->>AuthController: POST /auth/login
  AuthController->>AuthService: login(dto)
  AuthService->>UsersService: findByPhone(phone)
  UsersService->>DB: tìm user theo số điện thoại
  alt Không có user hoặc sai mật khẩu
    AuthService-->>LoginPage: 401 Sai số điện thoại hoặc mật khẩu
  else isActive = false
    AuthService-->>LoginPage: 403 Tài khoản bị khóa
  else isPhoneVerified = false
    AuthService-->>LoginPage: 403 Chưa xác thực số điện thoại
    LoginPage->>VerifyOtpPage: load(phone)
    Note over VerifyOtpPage: Khách bấm gửi lại mã (onResend) rồi nhập OTP như mục B
  else Hợp lệ
    AuthService->>AuthService: issueToken(user)
    AuthService-->>LoginPage: 200 token và user
    LoginPage->>AuthStore: setSession(token, user)
    LoginPage->>CartStore: loadForUser(userId)
    LoginPage->>CartStore: applyPending()
    Note over CartStore: Nạp giỏ của tài khoản này và thêm món đang nhớ tạm nếu có (BR29)
  end
```

## D. Đăng xuất (UC03)

```mermaid
sequenceDiagram
  autonumber
  actor Customer as Khách hàng
  participant AppHeader
  participant AuthStore
  participant AuthController
  participant AuthService
  participant TokenRevocationService
  participant DB

  Customer->>AppHeader: onLogout()
  AppHeader->>AuthStore: logout()
  AuthStore->>AuthController: POST /auth/logout
  AuthController->>AuthService: logout(jti, expiresAt)
  AuthService->>TokenRevocationService: revoke(jti, expiresAt)
  TokenRevocationService->>TokenRevocationService: purgeExpired()
  TokenRevocationService->>DB: dọn dòng đã quá hạn, rồi lưu RevokedToken (jti)
  AuthService-->>AuthStore: 200
  Note over AuthStore: Dù server trả lời hay không (mất mạng, token đã hết hạn), client vẫn xóa token và user. Từ nay token cũ bị từ chối 401, muốn dùng tiếp phải đăng nhập lấy token mới (BR19)
  Note over AuthStore: Giỏ hàng trong bộ nhớ được dọn, bản đã lưu theo tài khoản vẫn còn cho lần đăng nhập sau
  AuthStore-->>AppHeader: về trang menu
```

## E. Xem và cập nhật thông tin, đổi mật khẩu (UC04, UC05, UC06)

```mermaid
sequenceDiagram
  autonumber
  actor Customer as Khách hàng
  participant ProfilePage
  participant UsersController
  participant UsersService
  participant DB

  Customer->>ProfilePage: load()
  ProfilePage->>UsersController: GET /users/me
  UsersController->>UsersService: getProfile(userId)
  UsersService->>DB: đọc User
  UsersService-->>ProfilePage: 200 hồ sơ

  opt UC05 Cập nhật thông tin
    Customer->>ProfilePage: saveProfile(form)
    ProfilePage->>UsersController: PATCH /users/me
    UsersController->>UsersService: updateProfile(userId, dto)
    alt Email mới đã có người dùng
      UsersService-->>ProfilePage: 409
    else Hợp lệ
      UsersService->>DB: cập nhật fullName và email (xóa email nếu để trống)
      UsersService-->>ProfilePage: 200 hồ sơ mới
    end
  end

  opt UC06 Đổi mật khẩu
    Customer->>ProfilePage: savePassword(form)
    ProfilePage->>UsersController: PATCH /users/me/password
    UsersController->>UsersService: changePassword(userId, dto)
    UsersService->>DB: đọc passwordHash
    alt Mật khẩu cũ sai
      UsersService-->>ProfilePage: 401
    else Mật khẩu mới dưới 8 ký tự
      UsersController-->>ProfilePage: 400 từ validate DTO
    else Hợp lệ
      UsersService->>DB: lưu hash mới
      UsersService-->>ProfilePage: 200
    end
  end
```

## F. Quên mật khẩu (UC68, bổ sung ngoài BFD gốc)

Khách chưa đăng nhập nhập số điện thoại, nhận OTP mock, nhập mã cùng mật khẩu mới thì đặt lại được. OTP có mục đích riêng `RESET_PASSWORD` nên mã gửi lúc đăng ký không dùng được ở đây (BR31). Bước xin mã **luôn trả cùng một câu** dù số có đăng ký hay không, để người lạ không dò ra số nào đã có tài khoản.

```mermaid
sequenceDiagram
  autonumber
  actor Guest as Khách vãng lai
  participant ForgotPasswordPage
  participant AuthController
  participant AuthService
  participant UsersService
  participant OtpService
  participant SmsGateway
  participant DB

  Guest->>ForgotPasswordPage: onRequestOtp(form)
  ForgotPasswordPage->>AuthController: POST /auth/forgot-password
  AuthController->>AuthService: forgotPassword(dto)
  AuthService->>UsersService: findByPhone(phone)
  UsersService->>DB: tìm user theo số điện thoại
  alt Có user, đã xác thực số điện thoại và isActive
    AuthService->>OtpService: sendOtp(phone, purpose)
    OtpService->>OtpService: generateCode()
    OtpService->>DB: lưu OtpCode mục đích RESET_PASSWORD, hạn 5 phút
    OtpService->>SmsGateway: send(phone, content)
  else Số chưa đăng ký, chưa xác thực hoặc bị khóa
    Note over AuthService: Không gửi mã, nhưng vẫn trả lời giống hệt nhánh trên
  end
  AuthService-->>ForgotPasswordPage: 200 Nếu số này đã đăng ký thì mã đã được gửi
  Note over ForgotPasswordPage: Gửi quá nhanh (dưới 60 giây) thì 422

  opt Không nhận được mã, bấm gửi lại
    Guest->>ForgotPasswordPage: onResend()
    ForgotPasswordPage->>AuthController: POST /auth/forgot-password
    Note over AuthController: Chạy lại đúng luồng xin mã ở trên
  end

  Guest->>ForgotPasswordPage: onResetPassword(form)
  ForgotPasswordPage->>AuthController: POST /auth/reset-password
  AuthController->>AuthService: resetPassword(dto)
  AuthService->>OtpService: verifyOtp(phone, code, purpose)
  OtpService->>DB: đọc OtpCode RESET_PASSWORD mới nhất chưa dùng
  alt Sai mã, hết hạn, hoặc đã nhập sai 5 lần
    OtpService-->>ForgotPasswordPage: 422 OTP không hợp lệ
  else Đúng mã
    OtpService->>DB: đánh dấu OtpCode đã dùng
    AuthService->>UsersService: findByPhone(phone)
    AuthService->>UsersService: setPassword(userId, newPassword)
    UsersService->>DB: lưu mật khẩu mới (băm bcrypt)
    AuthService-->>ForgotPasswordPage: 200 Đã đặt lại mật khẩu
    Note over ForgotPasswordPage: Chuyển về LoginPage, khách đăng nhập bằng mật khẩu mới. Không tự đăng nhập
  end
```

Mật khẩu mới dưới 8 ký tự trả 400. Đặt lại xong, các JWT đã cấp trước đó **không** bị thu hồi **[GĐ]**.

Mọi route `/users/*` đi qua `JwtAuthGuard` (thiếu hoặc sai token trả 401, user bị khóa trả 403). Số điện thoại **không đổi được** sau khi đăng ký (đã chốt), nên UC05 chỉ sửa họ tên và email.
