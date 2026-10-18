# 07 · Activity 04 — Tài khoản (UC01–UC06, BFD nhóm 1)

Đăng ký (có OTP), đăng nhập, đăng xuất, hồ sơ, đổi mật khẩu. Chi tiết gọi hàm ở `05-sequence/Sequence-01-TaiKhoan.md`. Quy tắc: BR17, BR19, BR22, BR27.

```mermaid
flowchart TD
  S((Bắt đầu: Khách vãng lai)) --> A0{"Đã có tài khoản?"}
  A0 -- "Chưa UC01" --> A1["RegisterPage.submit, AuthService.register"]
  A1 --> A2{"Dữ liệu hợp lệ? Số điện thoại bắt buộc, email tùy chọn"}
  A2 -- "Không: 400" --> A1
  A2 -- "Có" --> A3{"Số điện thoại đã dùng? UsersService.findByPhone"}
  A3 -- "Có: 409" --> A1
  A3 -- "Chưa" --> A3b{"Có điền email?"}
  A3b -- "Có" --> A3c{"Email đã dùng? UsersService.findByEmail"}
  A3c -- "Có: 409" --> A1
  A3c -- "Chưa" --> A4
  A3b -- "Không" --> A4["UsersService.create, role CUSTOMER, chưa xác thực"]
  A4 --> A5["OtpService.sendOtp, gửi mã bằng SmsGateway.send"]
  A5 --> A6["VerifyOtpPage.load, khách nhập mã"]
  A6 --> A7{"Mã đúng? OtpService.verifyOtp"}
  A7 -- "Sai, hết hạn, quá 5 lần: 422" --> A8{"Gửi lại mã?"}
  A8 -- "Có: VerifyOtpPage.onResend" --> A5
  A8 -- "Không" --> Z((Kết thúc))
  A7 -- "Đúng" --> A9["UsersService.markPhoneVerified"]
  A9 --> D1
  A0 -- "Rồi UC02" --> B1["LoginPage.submit, AuthService.login"]
  B1 --> B2{"Đúng số điện thoại và mật khẩu?"}
  B2 -- "Không: 401" --> B1
  B2 -- "Quên mật khẩu UC68" --> R1["ForgotPasswordPage.onRequestOtp, AuthService.forgotPassword"]
  R1 --> R2["OtpService.sendOtp mục đích RESET_PASSWORD, mã gửi bằng SmsGateway.send"]
  R2 --> R3["ForgotPasswordPage.onResetPassword: nhập mã và mật khẩu mới"]
  R3 --> R4{"Mã đúng? OtpService.verifyOtp"}
  R4 -- "Sai, hết hạn, quá 5 lần: 422" --> R5{"Gửi lại mã?"}
  R5 -- "Có: ForgotPasswordPage.onResend" --> R2
  R5 -- "Không" --> Z
  R4 -- "Đúng" --> R6["UsersService.setPassword lưu mật khẩu mới"]
  R6 --> B1
  B2 -- "Đúng" --> B3{"Tài khoản isActive?"}
  B3 -- "Không: 403" --> Z
  B3 -- "Có" --> B4{"Đã xác thực số điện thoại?"}
  B4 -- "Chưa: 403" --> A6
  B4 -- "Rồi" --> D1["Cấp JWT, AuthStore.setSession"]
  D1 --> E1{"Khách hàng muốn làm gì?"}
  E1 -- "Xem hồ sơ UC04" --> F1["ProfilePage.load, UsersService.getProfile"] --> E1
  E1 -- "Sửa hồ sơ UC05" --> G1["ProfilePage.saveProfile, UsersService.updateProfile"]
  G1 --> G2{"Hợp lệ? Email mới chưa ai dùng"}
  G2 -- "Không: 400 hoặc 409" --> G1
  G2 -- "Có" --> E1
  E1 -- "Đổi mật khẩu UC06" --> H1["ProfilePage.savePassword, UsersService.changePassword"]
  H1 --> H2{"Mật khẩu cũ đúng và mới đủ 8 ký tự?"}
  H2 -- "Cũ sai: 401, mới ngắn: 400" --> H1
  H2 -- "Đúng" --> E1
  E1 -- "Đăng xuất UC03" --> I1["AppHeader.onLogout, AuthStore.logout"]
  I1 --> I1a["AuthService.logout: TokenRevocationService.revoke thu hồi JWT"]
  I1a --> I2["Xóa JWT và thông tin ở client, giỏ hàng lưu theo tài khoản"]
  I2 --> I3["Dùng lại phải đăng nhập để lấy JWT mới"] --> Z
  E1 -- "Rời trang" --> Z
```
