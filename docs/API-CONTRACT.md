# API Contract — BrewLite

> **Đây là hợp đồng giữa frontend và backend.**
> Không bên nào được tự ý thay đổi. Muốn đổi: báo người kia, cập nhật file này, commit `docs(task-N): ...`.

Base URL: `http://localhost:3001`
Content-Type: `application/json`
Auth: `Authorization: Bearer <jwt_token>` (các route cần đăng nhập)

---

## Thực thể (Entity)

### Product
```json
{
  "id": "uuid",
  "name": "string",
  "price": "number (VND, ví dụ: 35000)",
  "imageUrl": "string | null",
  "stock": "number"
}
```

### User
```json
{
  "id": "uuid",
  "email": "string",
  "passwordHash": "string (không trả về client)",
  "loyaltyPoints": "number"
}
```

### Order
```json
{
  "id": "uuid",
  "userId": "uuid",
  "status": "PENDING | PAID | PREPARING | READY | COMPLETED | PAYMENT_FAILED | CANCELLED",
  "total": "number (VND)",
  "createdAt": "ISO8601 string"
}
```

### OrderItem
```json
{
  "id": "uuid",
  "orderId": "uuid",
  "productId": "uuid",
  "size": "S | M | L",
  "qty": "number",
  "toppings": "string[] (mảng id topping, có thể rỗng)",
  "lineTotal": "number (VND, đã gồm phụ thu size và topping)"
}
```

### Topping
```json
{
  "id": "top-001",
  "name": "Trân châu đen",
  "price": 7000
}
```

### Payment
```json
{
  "id": "uuid",
  "orderId": "uuid",
  "idempotencyKey": "string (UUID)",
  "amount": "number (VND)",
  "method": "WALLET | CARD"
}
```

---

## Trạng thái đơn hàng

```
PENDING → PAID → PREPARING → READY → COMPLETED
PENDING → PAYMENT_FAILED  (có thể thử lại)
PENDING → CANCELLED       (kết thúc, không hoàn tác)
PAID    → CANCELLED       (kết thúc)
```

Chuyển trạng thái ngoài sơ đồ trên phải trả lỗi 422.

---

## Endpoints

### GET /health — Kiểm tra server

**Auth:** Không cần

**Response 200:**
```json
{ "status": "ok" }
```

---

### GET /products — Danh sách menu

**Auth:** Không cần

**Response 200:**
```json
[
  {
    "id": "prod-001",
    "name": "Cà phê sữa",
    "price": 35000,
    "imageUrl": null,
    "stock": 50
  },
  {
    "id": "prod-002",
    "name": "Americano",
    "price": 40000,
    "imageUrl": null,
    "stock": 30
  }
]
```

**Response 500:**
```json
{ "statusCode": 500, "message": "Internal server error" }
```

---

### GET /products/:id — Chi tiết sản phẩm

**Auth:** Không cần

**Response 200:**
```json
{
  "id": "prod-001",
  "name": "Cà phê sữa",
  "price": 35000,
  "imageUrl": null,
  "stock": 50
}
```

**Response 404:**
```json
{ "statusCode": 404, "message": "Sản phẩm không tồn tại" }
```

---

### POST /auth/register — Đăng ký

**Auth:** Không cần

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Validation: email hợp lệ, password ≥ 6 ký tự

**Response 201:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "loyaltyPoints": 0
}
```

**Response 400 (validation failed):**
```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password must be longer than or equal to 6 characters"]
}
```

**Response 409 (email đã tồn tại):**
```json
{ "statusCode": 409, "message": "Email đã được sử dụng" }
```

---

### POST /auth/login — Đăng nhập

**Auth:** Không cần

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response 200:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXV1aWQiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE2OTQ1MDAwMDB9.abc123",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "loyaltyPoints": 0
  }
}
```

**Response 401:**
```json
{ "statusCode": 401, "message": "Email hoặc mật khẩu không đúng" }
```

---

### POST /orders — Tạo đơn hàng

**Auth:** Cần JWT

**Request body:**
```json
{
  "items": [
    {
      "productId": "prod-001",
      "size": "M",
      "qty": 2,
      "toppings": ["top-001"]
    }
  ]
}
```

Validation: items không rỗng, qty ≥ 1, size là S/M/L, `toppings` không bắt buộc

**Response 201:**
```json
{
  "id": "order-uuid-001",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING",
  "total": 70000,
  "createdAt": "2026-10-05T10:00:00.000Z",
  "items": [
    {
      "id": "item-uuid-001",
      "productId": "prod-001",
      "size": "M",
      "qty": 2,
      "lineTotal": 70000
    }
  ]
}
```

**Response 400 (giỏ rỗng):**
```json
{ "statusCode": 400, "message": "Giỏ hàng không được rỗng" }
```

**Response 401 (chưa đăng nhập):**
```json
{ "statusCode": 401, "message": "Unauthorized" }
```

**Response 422 (hết hàng):**
```json
{ "statusCode": 422, "message": "Sản phẩm prod-001 không đủ hàng" }
```

---

### POST /payments — Thanh toán

**Auth:** Cần JWT
**Header bắt buộc:** `Idempotency-Key: <uuid>` (để tránh thanh toán trùng)

**Request body:**
```json
{
  "orderId": "order-uuid-001",
  "amount": 70000,
  "method": "WALLET"
}
```

method: `WALLET` hoặc `CARD`

**Response 201 (thành công — 80% xác suất):**
```json
{
  "id": "payment-uuid-001",
  "orderId": "order-uuid-001",
  "amount": 70000,
  "method": "WALLET",
  "status": "PAID"
}
```

**Response 201 (thất bại giả lập — 20% xác suất):**
```json
{
  "id": "payment-uuid-001",
  "orderId": "order-uuid-001",
  "amount": 70000,
  "method": "WALLET",
  "status": "PAYMENT_FAILED"
}
```

**Response 400 (thiếu Idempotency-Key):**
```json
{ "statusCode": 400, "message": "Thiếu header Idempotency-Key" }
```

**Response 409 (đã thanh toán rồi):**
```json
{ "statusCode": 409, "message": "Đơn hàng đã được thanh toán" }
```

---

### GET /orders/me — Lịch sử đơn hàng của user hiện tại

**Auth:** Cần JWT

**Response 200:**
```json
[
  {
    "id": "order-uuid-001",
    "status": "COMPLETED",
    "total": 70000,
    "createdAt": "2026-10-05T10:00:00.000Z",
    "items": [
      {
        "id": "item-uuid-001",
        "productId": "prod-001",
        "productName": "Cà phê sữa",
        "size": "M",
        "qty": 2,
        "lineTotal": 70000
      }
    ]
  }
]
```

---

## Dữ liệu giả cho frontend

Dùng mảng này để code giao diện khi backend chưa xong.
Lưu tại `frontend/src/data/mock-products.ts` để import trực tiếp.

```json
[
  {
    "id": "prod-001",
    "name": "Cà phê sữa",
    "price": 35000,
    "imageUrl": null,
    "stock": 50
  },
  {
    "id": "prod-002",
    "name": "Americano",
    "price": 40000,
    "imageUrl": null,
    "stock": 30
  },
  {
    "id": "prod-003",
    "name": "Cappuccino",
    "price": 45000,
    "imageUrl": null,
    "stock": 25
  },
  {
    "id": "prod-004",
    "name": "Trà đào",
    "price": 39000,
    "imageUrl": null,
    "stock": 40
  }
]
```

## Quy tắc tính tiền

Giá trong bảng `Product` là **giá size S**. Công thức một dòng giỏ hàng:

```
lineTotal = (price + phụ_thu_size + tổng_giá_topping) × qty
```

| Size | Phụ thu |
|---|---|
| S | +0 |
| M | +5.000 |
| L | +10.000 |

Ví dụ: Cà phê sữa (35.000) size L kèm trân châu đen (7.000), số lượng 1
→ `(35000 + 10000 + 7000) × 1 = 52000`

Topping hiện có (seed sẵn trong DB): `top-001` Trân châu đen 7.000, `top-002` Thạch dừa 6.000, `top-003` Kem phô mai 10.000, `top-004` Shot espresso 12.000.

**Frontend và backend phải dùng chung công thức này.** Backend luôn tính lại từ đầu, không tin giá do client gửi lên.

## Quy ước giá

Mọi giá tiền đều là **số nguyên VND** (ví dụ: `35000` chứ không phải `35.000` hay `35,000`). Frontend format hiển thị bằng `toLocaleString('vi-VN')`.
