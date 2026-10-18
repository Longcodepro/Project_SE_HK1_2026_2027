# 08 · Collaboration 04 — Tài khoản (UC01–UC06, UC68)

Cùng nội dung với `05-sequence/Sequence-01-TaiKhoan.md`, nhìn theo liên kết đối tượng. Số 1 đăng ký (tạo tài khoản và gửi OTP), 2 nhập OTP, 3 gửi lại OTP, 4 đăng nhập, 5 đăng xuất, 6 xem hồ sơ, 7 sửa hồ sơ, 8 đổi mật khẩu.

```mermaid
flowchart LR
  Guest[":Guest"]
  Customer[":Customer"]
  RP[":RegisterPage"]
  VP[":VerifyOtpPage"]
  LP[":LoginPage"]
  AH[":AppHeader"]
  AS[":AuthStore"]
  CS[":CartStore"]
  TR[":TokenRevocationService"]
  FP[":ForgotPasswordPage"]
  PP[":ProfilePage"]
  AC[":AuthController"]
  ASV[":AuthService"]
  OTP[":OtpService"]
  SG[":SmsGateway"]
  UC[":UsersController"]
  US[":UsersService"]

  Guest -->|"1: submit(form)"| RP
  RP -->|"1.1: register(dto)"| AC
  AC -->|"1.1.1: register(dto)"| ASV
  ASV -->|"1.1.1.1: findByPhone(phone)"| US
  ASV -->|"1.1.1.2: findByEmail(email)"| US
  ASV -->|"1.1.1.3: create(data)"| US
  ASV -->|"1.1.1.4: sendOtp(phone, purpose)"| OTP
  OTP -->|"1.1.1.4.1: generateCode()"| OTP
  OTP -->|"1.1.1.4.2: send(phone, content)"| SG
  RP -->|"1.2: load(phone)"| VP

  Guest -->|"2: submit(form)"| VP
  VP -->|"2.1: verifyOtp(dto)"| AC
  AC -->|"2.1.1: verifyOtp(dto)"| ASV
  ASV -->|"2.1.1.1: verifyOtp(phone, code, purpose)"| OTP
  ASV -->|"2.1.1.2: markPhoneVerified(phone)"| US
  ASV -->|"2.1.1.3: issueToken(user)"| ASV
  VP -->|"2.2: setSession(token, user)"| AS
  VP -->|"2.3: loadForUser(userId)"| CS
  VP -->|"2.4: applyPending()"| CS

  Guest -->|"3: onResend()"| VP
  VP -->|"3.1: resendOtp(dto)"| AC
  AC -->|"3.1.1: resendOtp(dto)"| ASV
  ASV -->|"3.1.1.1: sendOtp(phone, purpose)"| OTP

  Guest -->|"4: submit(form)"| LP
  LP -->|"4.1: login(dto)"| AC
  AC -->|"4.1.1: login(dto)"| ASV
  ASV -->|"4.1.1.1: findByPhone(phone)"| US
  ASV -->|"4.1.1.2: issueToken(user)"| ASV
  LP -->|"4.2: setSession(token, user)"| AS
  LP -->|"4.3: load(phone)"| VP
  LP -->|"4.4: loadForUser(userId)"| CS
  LP -->|"4.5: applyPending()"| CS

  Customer -->|"5: onLogout()"| AH
  AH -->|"5.1: logout()"| AS
  AS -->|"5.1.1: logout(req)"| AC
  AC -->|"5.1.1.1: logout(jti, expiresAt)"| ASV
  ASV -->|"5.1.1.1.1: revoke(jti, expiresAt)"| TR
  TR -->|"5.1.1.1.1.1: purgeExpired()"| TR

  Customer -->|"6: load()"| PP
  PP -->|"6.1: getProfile(req)"| UC
  UC -->|"6.1.1: getProfile(userId)"| US
  Customer -->|"7: saveProfile(form)"| PP
  PP -->|"7.1: updateProfile(req, dto)"| UC
  UC -->|"7.1.1: updateProfile(userId, dto)"| US
  Customer -->|"8: savePassword(form)"| PP
  PP -->|"8.1: changePassword(req, dto)"| UC
  UC -->|"8.1.1: changePassword(userId, dto)"| US

  Guest -->|"9: onRequestOtp(form)"| FP
  FP -->|"9.1: forgotPassword(dto)"| AC
  AC -->|"9.1.1: forgotPassword(dto)"| ASV
  ASV -->|"9.1.1.1: findByPhone(phone)"| US
  ASV -->|"9.1.1.2: sendOtp(phone, purpose)"| OTP
  Guest -->|"10: onResend()"| FP
  FP -->|"10.1: forgotPassword(dto)"| AC
  Guest -->|"11: onResetPassword(form)"| FP
  FP -->|"11.1: resetPassword(dto)"| AC
  AC -->|"11.1.1: resetPassword(dto)"| ASV
  ASV -->|"11.1.1.1: verifyOtp(phone, code, purpose)"| OTP
  ASV -->|"11.1.1.2: findByPhone(phone)"| US
  ASV -->|"11.1.1.3: setPassword(userId, newPassword)"| US
```

| Số | UC | Ghi chú |
|---|---|---|
| 1.1.1.1 và 1.1.1.2 | UC01 | Số điện thoại hoặc email trùng thì dừng và trả 409. 1.1.1.2 chỉ chạy khi khách điền email |
| 1.1.1.4 đến 1.1.1.4.2 | UC01 | Tạo và gửi mã OTP qua `SmsGateway` (mock), hạn 5 phút (BR27) |
| 2.1.1.1 | UC01 | Sai mã, hết hạn hoặc quá 5 lần nhập sai trả 422 |
| 2.1.1.3 và 4.1.1.2 | UC01, UC02 | Cùng hàm `AuthService.issueToken`. Chỉ đăng ký xong phải qua OTP rồi mới nhận token |
| 2.3, 2.4 và 4.4, 4.5 | UC01, UC02 | Sau khi vào phiên: nạp giỏ của tài khoản này, rồi thêm món khách đã chọn lúc chưa đăng nhập (BR29). 4.4 và 4.5 chỉ chạy khi đăng nhập thành công, không chạy ở nhánh 4.3 |
| 3.1.1.1 | UC01 | Gửi lại trong vòng 60 giây trả 422 |
| 4.1.1.1 | UC02 | Đăng nhập bằng số điện thoại. Sai thông tin 401, khóa 403. Chưa xác thực OTP thì 403 và chuyển 4.3 |
| 5.1 đến 5.1.1.1.1.1 | UC03 | Máy chủ ghi `jti` của thẻ vào danh sách thu hồi và dọn dòng quá hạn (BR19). Thẻ này từ nay bị từ chối 401. Client luôn xóa phiên cục bộ, kể cả khi gọi máy chủ thất bại |
| 6.1.1 đến 8.1.1 | UC04, UC05, UC06 | Cần JWT (`JwtAuthGuard`) |
| 9 đến 9.1.1.2 | UC68 | Xin mã đặt lại mật khẩu. Chỉ gửi OTP (mục đích `RESET_PASSWORD`) khi số đã đăng ký, đã xác thực, không bị khóa; câu trả lời luôn giống nhau (BR31) |
| 10 đến 10.1 | UC68 | Gửi lại mã, chạy lại đúng luồng 9; trong 60 giây trả 422 |
| 11 đến 11.1.1.3 | UC68 | Sai mã hoặc hết hạn trả 422, mật khẩu mới dưới 8 ký tự trả 400. Đúng thì lưu mật khẩu mới, khách quay về đăng nhập |

Số 9, 10, 11 là quên mật khẩu (UC68).
