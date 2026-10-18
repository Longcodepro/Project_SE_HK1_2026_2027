# 05 · Sequence 16 — Nhân viên xử lý món không làm được (UC74)

Khi một món trong đơn **hết làm được** (hết nguyên liệu), nhân viên phát hiện lúc chuẩn bị hoặc trước khi giao, ghi nhận trong hệ thống và chọn **một trong hai cách**: hoàn tiền món đó vào ví của khách, hoặc đổi món khác cho khách (đổi ngoài quầy, hệ thống chỉ ghi nhận). Mỗi lần xử lý lưu **ai xử lý và vì sao** để quản lý kiểm tra. Quy tắc: BR45, BR43. Collaboration tương ứng: `08-collaboration/Collaboration-15-XuLyMonKhongLamDuoc.md`.

```mermaid
sequenceDiagram
  autonumber
  actor Staff as Nhân viên
  actor Manager as Quản lý
  participant AdminOrdersPage
  participant OrdersController
  participant OrdersService
  participant RefundsService
  participant WalletService
  participant DB

  Staff->>AdminOrdersPage: onHandleMissingItem(orderId, orderItemId, quantity, resolution, note)
  AdminOrdersPage->>OrdersController: POST /admin/orders/:id/item-issues
  OrdersController->>OrdersService: handleMissingItem(orderId, staffId, dto)
  OrdersService->>DB: đọc đơn kèm dòng và các lần xử lý trước
  alt Không có đơn hoặc dòng
    OrdersService-->>AdminOrdersPage: 404
  else Đơn chưa trả tiền, đã COMPLETED (đã giao) hoặc đã CANCELLED
    OrdersService-->>AdminOrdersPage: 409
  else quantity vượt số ly còn lại, hoặc note dưới 5 ký tự
    OrdersService-->>AdminOrdersPage: 422 hoặc 400
  else resolution là REFUND_TO_WALLET
    OrdersService->>RefundsService: refund(order, amount, reason, actorId, note)
    Note over RefundsService: amount = đơn giá ly × quantity, không chia lại khuyến mãi, tổng hoàn không vượt totalAmount. Refund.reason = MISSING_ITEM
    RefundsService->>WalletService: credit(userId, amount, refundId)
    WalletService->>DB: cộng ví, lưu WalletTransaction REFUND_IN
    OrdersService->>DB: lưu ItemIssue REFUND_TO_WALLET kèm refundId, người xử lý, lý do
    OrdersService-->>AdminOrdersPage: 201
  else resolution là EXCHANGE
    OrdersService->>DB: lưu ItemIssue EXCHANGE, người xử lý, lý do (không có tiền, đổi món ngoài quầy)
    OrdersService-->>AdminOrdersPage: 201
  end

  Manager->>AdminOrdersPage: loadItemIssues(query)
  AdminOrdersPage->>OrdersController: GET /admin/item-issues
  OrdersController->>OrdersService: listItemIssues(query)
  OrdersService->>DB: đọc các lần xử lý món thiếu kèm đơn, món, nhân viên, lý do, mới nhất trước
  OrdersService-->>AdminOrdersPage: 200 danh sách để quản lý kiểm tra
```

Chỉ làm được khi đơn đang `PAID`, `PREPARING` hoặc `READY` (trước khi giao). Xử lý món không làm được **không đổi trạng thái đơn**. `POST /admin/orders/:id/item-issues` cho `STAFF` và `MANAGER`; `GET /admin/item-issues` chỉ `MANAGER`.
