# Công cụ test endpoint BrewLite

Mỗi chức năng có một file mô tả test trong `cases/`. Từ các file đó sinh ra **collection Postman** và cũng **chạy thẳng bằng dòng lệnh**, nên không phải viết test hai lần.

## Dùng nhanh

```bash
# 1. Bật Postgres, nạp dữ liệu mẫu, chạy backend
docker compose up -d postgres          # ở thư mục gốc
cd backend && npx prisma migrate deploy && npm run seed
npm run start:dev

# 2. Chạy toàn bộ test ở terminal (cần backend đang chạy)
npm run postman:run
npm run postman:run -- --only=auth      # chỉ một chức năng (folder đăng nhập vẫn chạy trước)
npm run postman:run -- --base=http://localhost:3001

# 3. Sinh lại file Postman sau khi sửa case
npm run postman:build
```

Trong Postman: **Import** hai file `BrewLite.postman_collection.json` và `BrewLite.postman_environment.json`, chọn environment **BrewLite local**, chạy folder `01 · Đăng nhập lấy token` trước rồi chạy các folder còn lại (Collection Runner chạy đúng thứ tự). Hoặc dùng Newman: `npx newman run postman/BrewLite.postman_collection.json -e postman/BrewLite.postman_environment.json`.

## Tài khoản mẫu (mật khẩu chung `Brew@1234`)

| Vai trò | Số điện thoại | Biến token |
|---|---|---|
| Quản lý | 0900000001 | `managerToken` |
| Nhân viên | 0911000001 | `staffToken` |
| Khách hàng | 0922000001, 0922000002 | `customerToken`, `customer2Token` |
| Khách bị khóa | 0922000058 | |
| Khách chưa xác thực OTP | 0933000001 | |

OTP mặc định luôn là `123456` (đặt `OTP_RANDOM=true` để sinh ngẫu nhiên).

## Viết case mới

Thêm `cases/NN-ten-chuc-nang.ts` xuất một `Folder`, rồi đăng ký trong `cases/index.ts`. Mỗi case nên phủ: thành công, sai dữ liệu (400), chưa đăng nhập (401), sai quyền (403), không tìm thấy (404), xung đột (409), vi phạm nghiệp vụ (422). Xem kiểu `Case` trong `lib/dsl.ts`:

- `auth: 'customer'` gắn `Authorization: Bearer {{customerToken}}`.
- `save: { orderId: 'id' }` lưu giá trị từ JSON trả về để case sau dùng.
- `set: { phone: 'phone' }` tự sinh số điện thoại mới mỗi lần chạy, tránh trùng khi chạy lại.
- Trong body, `"{{x}}"` chèn biến dạng chuỗi, `"@x"` chèn nguyên giá trị (số, boolean).
- `expect: [{ path: 'items.0.id', min: 1 }]` kiểm tra nội dung trả về.

`npm run seed:reset` đưa dữ liệu về trạng thái ban đầu nếu các lần chạy trước làm đổi dữ liệu.
