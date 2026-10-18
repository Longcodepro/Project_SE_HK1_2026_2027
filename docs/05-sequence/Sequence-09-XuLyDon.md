# 05 · Sequence 09 — Nhân viên xử lý đơn (UC30–UC35)

Phủ: UC30 Xem danh sách đơn, UC31 Lọc theo trạng thái (extend), UC32 Xem chi tiết (include UC33 Xem thông tin thanh toán), UC34 Cập nhật trạng thái, UC35 Giao món (gồm tra cứu theo mã nhận hàng, BFD 10.9). Quy tắc: BR12, BR13, BR18, BR28, BR42. Hủy đơn (UC36) ở `Sequence-07-HuyDon.md`, phản hồi dịch vụ (UC28, UC37) ở `Sequence-08-PhanHoiDichVu`. Mọi route `/admin/orders*` yêu cầu `STAFF` hoặc `MANAGER`, vai trò khác trả 403.

```mermaid
sequenceDiagram
  autonumber
  actor Staff as Nhân viên
  participant AdminOrdersPage
  participant OrdersController
  participant OrdersService
  participant PaymentsService
  participant NotificationService
  participant FeedbackService
  participant DB

  Note over Staff,DB: UC30 và UC31 Danh sách đơn
  Staff->>AdminOrdersPage: load(status)
  AdminOrdersPage->>OrdersController: GET /admin/orders
  OrdersController->>OrdersService: listAll(query)
  OrdersService->>DB: đọc đơn, lọc theo status nếu có, mới nhất trước
  OrdersService-->>AdminOrdersPage: 200 danh sách

  Note over Staff,DB: UC32 và UC33 Chi tiết đơn kèm thanh toán
  Staff->>AdminOrdersPage: onOpen(orderId)
  AdminOrdersPage->>OrdersController: GET /admin/orders/:id
  OrdersController->>OrdersService: getDetail(orderId)
  OrdersService->>DB: đọc đơn, khách, dòng (kèm nhiệt độ và ghi chú), topping, Refund, phản hồi dịch vụ nếu có, người hủy và lý do hủy nếu đơn đã hủy, các lần xử lý món thiếu
  OrdersService->>PaymentsService: getByOrder(orderId)
  OrdersService->>FeedbackService: getByOrder(orderId)
  PaymentsService->>DB: đọc các Payment của đơn
  alt Không có đơn
    OrdersService-->>AdminOrdersPage: 404
  else Tìm thấy
    OrdersService-->>AdminOrdersPage: 200 chi tiết kèm thanh toán và hoàn tiền
  end

  Note over Staff,DB: UC34 Cập nhật trạng thái
  Staff->>AdminOrdersPage: onChangeStatus(orderId, status)
  AdminOrdersPage->>OrdersController: PATCH /admin/orders/:id/status
  OrdersController->>OrdersService: updateStatus(orderId, status)
  OrdersService->>OrdersService: assertTransition(from, to)
  alt Không phải PAID sang PREPARING hoặc PREPARING sang READY
    OrdersService-->>AdminOrdersPage: 409
  else Hợp lệ
    opt Đích là READY
      OrdersService->>OrdersService: generatePickupCode()
    end
    OrdersService->>DB: cập nhật status, kèm pickupCode nếu READY
    opt Đích là READY
      OrdersService->>NotificationService: notifyOrderEvent(orderId, event)
      Note over NotificationService: event = ORDER_READY, báo nước đã xong kèm mã nhận hàng (Sequence-14)
    end
    OrdersService-->>AdminOrdersPage: 200 đơn mới
  end

  Note over Staff,DB: UC35 Giao món cho khách
  Staff->>AdminOrdersPage: onLookupPickup(code)
  Note over Staff,AdminOrdersPage: code do nhân viên nhập vào ô nhập số (quét QR bằng camera sẽ làm sau, BR42)
  AdminOrdersPage->>OrdersController: GET /admin/orders/by-pickup-code/:code
  OrdersController->>OrdersService: findByPickupCode(code)
  OrdersService->>DB: tìm đơn theo pickupCode
  alt Không có đơn với mã này
    OrdersService-->>AdminOrdersPage: 404
  else Tìm thấy
    OrdersService-->>AdminOrdersPage: 200 đơn
    Staff->>AdminOrdersPage: onDeliver(orderId, pickupCode)
    AdminOrdersPage->>OrdersController: POST /admin/orders/:id/complete
    OrdersController->>OrdersService: complete(orderId, pickupCode)
    alt Đơn không ở READY
      OrdersService-->>AdminOrdersPage: 409
    else pickupCode không khớp
      OrdersService-->>AdminOrdersPage: 422
    else Hợp lệ
      OrdersService->>DB: Order thành COMPLETED
      OrdersService->>NotificationService: notifyOrderEvent(orderId, event)
      Note over NotificationService: event = ORDER_COMPLETED, gửi lời cảm ơn sau khi khách nhận món (Sequence-14)
      OrdersService-->>AdminOrdersPage: 200 đơn COMPLETED
    end
  end
```

`updateStatus` không nhận đích `COMPLETED` hay `CANCELLED`: hai trạng thái đó chỉ đến từ `complete` (UC35) và `cancelOrder` (UC27, UC36).
