# 05 · Sequence 06 — Theo dõi đơn hàng, điểm và mã giảm giá (UC24, UC25, UC26, UC29, UC70)

Phủ: UC24 Lịch sử đơn, UC25 Chi tiết đơn, UC26 Xem mã nhận hàng, UC29 Xem điểm tích lũy (kèm số ly), UC70 Xem các mã giảm giá của mình. Hủy đơn (UC27) ở `Sequence-07-HuyDon`, phản hồi dịch vụ 5 sao (UC28) ở `Sequence-08-PhanHoiDichVu`. Quy tắc: BR11, BR12, BR14, BR23, BR24, BR38, BR39, BR40, BR42.

```mermaid
sequenceDiagram
  autonumber
  actor Customer as Khách hàng
  participant OrderHistoryPage
  participant OrderDetailPage
  participant ProfilePage
  participant OrdersController
  participant OrdersService
  participant BillService
  participant FeedbackService
  participant UsersController
  participant LoyaltyService
  participant PromotionsController
  participant PromotionsService
  participant DB

  Note over Customer,DB: UC24 Xem lịch sử đơn hàng
  Customer->>OrderHistoryPage: load()
  OrderHistoryPage->>OrdersController: GET /orders/me
  OrdersController->>OrdersService: listByUser(userId)
  OrdersService->>DB: đọc đơn của khách, mới nhất trước
  OrdersService-->>OrderHistoryPage: 200 danh sách đơn

  Note over Customer,DB: UC25 Xem chi tiết đơn hàng
  Customer->>OrderDetailPage: load(orderId)
  OrderDetailPage->>OrdersController: GET /orders/:id
  OrdersController->>OrdersService: getByUser(userId, orderId)
  OrdersService->>DB: đọc đơn kèm dòng và topping
  OrdersService->>FeedbackService: getByOrder(orderId)
  Note over OrdersService: Đính kèm phản hồi dịch vụ của đơn nếu có
  alt Đơn không tồn tại hoặc không phải của khách
    OrdersService-->>OrderDetailPage: 404
  else Hợp lệ
    OrdersService-->>OrderDetailPage: 200 chi tiết đơn
  end

  loop Cứ 10 giây khi đơn chưa COMPLETED hoặc CANCELLED
    OrderDetailPage->>OrderDetailPage: poll()
    OrderDetailPage->>OrdersController: GET /orders/:id
    OrdersController->>OrdersService: getByUser(userId, orderId)
    OrdersService-->>OrderDetailPage: 200 trạng thái mới
  end

  alt UC26 Đơn sang READY
    Note over OrderDetailPage: Hiện pickupCode dạng số và mã QR (BR42), các trạng thái khác không có mã
  else Đơn sang COMPLETED và chưa có phản hồi
    Note over OrderDetailPage: Hiện khung đánh giá 1 đến 5 sao (UC28), xem Sequence-08-PhanHoiDichVu
  end

  opt UC25 Xem hóa đơn của đơn đã thanh toán
    Customer->>OrderDetailPage: openBill()
    OrderDetailPage->>OrdersController: GET /orders/:id/bill
    OrdersController->>OrdersService: getBill(userId, orderId)
    OrdersService->>OrdersService: getByUser(userId, orderId)
    alt Đơn chưa có lần thanh toán thành công
      OrdersService-->>OrderDetailPage: 409 Đơn chưa thanh toán
    else Đã thanh toán
      OrdersService->>BillService: buildBill(order)
      BillService->>DB: đọc dòng đơn, topping, Payment SUCCESS, Refund
      BillService-->>OrderDetailPage: 200 hóa đơn (BillView)
      Note over OrderDetailPage: Hiển thị theo mẫu 02-use_case/MauHoaDon.md
    end
  end

  Note over Customer,DB: UC29 Xem điểm tích lũy
  Customer->>ProfilePage: loadPoints()
  ProfilePage->>UsersController: GET /users/me/points
  UsersController->>LoyaltyService: getBalance(userId)
  LoyaltyService->>DB: đọc loyaltyPoints và totalCups của User, cùng các mốc thưởng đang bật
  LoyaltyService-->>ProfilePage: 200 số điểm, số ly, và còn thiếu bao nhiêu tới mốc thưởng kế tiếp

  Note over Customer,DB: UC70 Xem các mã giảm giá của mình
  Customer->>ProfilePage: loadVouchers()
  ProfilePage->>PromotionsController: GET /promotions/mine
  PromotionsController->>PromotionsService: listMine(userId)
  PromotionsService->>DB: đọc mã riêng của khách (còn dùng, đã dùng, hết hạn) và mã chung còn lượt
  PromotionsService-->>ProfilePage: 200 danh sách mã kèm mô tả, hạn dùng, trạng thái
```
