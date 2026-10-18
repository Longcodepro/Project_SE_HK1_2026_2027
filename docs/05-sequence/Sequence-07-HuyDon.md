# 05 · Sequence 07 — Hủy đơn hàng và hoàn tiền (UC27, UC36, UC38)

Phủ: UC27 Khách hủy đơn của mình, UC36 Nhân viên hủy đơn bất kỳ, UC38 Hoàn tiền (khi đơn đã trả tiền). Hai đường vào dùng chung hàm nội bộ `OrdersService.cancelOrder`. Quy tắc: BR13, BR16, BR43. Hoàn tiền **cộng vào ví trên web của khách** (xem `Sequence-15-ViHoanTien`), không trả về cổng thanh toán. Trạng thái xem `06-state/State-01-DonHang.md`.

## A. Hai đường vào

```mermaid
sequenceDiagram
  autonumber
  actor Customer as Khách hàng
  actor Staff as Nhân viên
  participant OrderDetailPage
  participant AdminOrdersPage
  participant OrdersController
  participant OrdersService

  alt UC27 Khách hủy đơn của mình
    Customer->>OrderDetailPage: onCancel()
    OrderDetailPage->>OrdersController: POST /orders/:id/cancel
    OrdersController->>OrdersService: cancelByCustomer(userId, orderId)
    OrdersService->>OrdersService: getByUser(userId, orderId)
    Note over OrdersService: Không phải đơn của khách thì 404
    OrdersService->>OrdersService: cancelOrder(order, reason, actorId, note)
    Note over OrdersService: reason = CUSTOMER_CANCEL, actorId = khách, note tùy chọn
  else UC36 Nhân viên hủy đơn
    Staff->>AdminOrdersPage: onCancel(orderId, note)
    AdminOrdersPage->>OrdersController: POST /admin/orders/:id/cancel
    OrdersController->>OrdersService: cancelByStaff(orderId, staffId, note)
    OrdersService->>OrdersService: getDetail(orderId)
    Note over OrdersService: Không có đơn thì 404. Thiếu lý do (note dưới 5 ký tự) thì 400
    OrdersService->>OrdersService: cancelOrder(order, reason, actorId, note)
    Note over OrdersService: reason = STAFF_CANCEL, actorId = nhân viên đang đăng nhập, note = lý do bắt buộc
  end
```

## B. Chi tiết `cancelOrder` (dùng chung, gồm UC38)

```mermaid
sequenceDiagram
  autonumber
  participant OrdersService
  participant RefundsService
  participant PromotionsService
  participant ProductsService
  participant LoyaltyService
  participant WalletService
  participant DB

  OrdersService->>OrdersService: cancelOrder(order, reason, actorId, note)
  alt status là PREPARING, READY, COMPLETED hoặc CANCELLED
    Note over OrdersService: 409 Không hủy được từ PREPARING trở đi
  else status là PENDING hoặc PAYMENT_FAILED
    OrdersService->>DB: Order thành CANCELLED, ghi cancelReason, người hủy (cancelledByUserId) và lý do (cancelNote)
    opt Đơn có dùng mã khuyến mãi
      OrdersService->>PromotionsService: releaseUsage(orderId)
      PromotionsService->>DB: ghi releasedAt, trả lại lượt dùng mã (mã riêng dùng lại được nếu còn hạn)
    end
    OrdersService->>ProductsService: releaseStock(items)
    ProductsService->>DB: cộng lại stockRemaining nếu stockDate là hôm nay và đơn tạo hôm nay (BR50)
    Note over OrdersService: Chưa trả tiền nên không hoàn tiền
  else status là PAID
    OrdersService->>RefundsService: refund(order, amount, reason, actorId, note)
    Note over RefundsService: amount = order.totalAmount, Refund.reason = CANCEL, ghi người thực hiện và lý do
    RefundsService->>DB: lưu Refund gắn Payment SUCCESS của đơn
    RefundsService->>WalletService: credit(userId, amount, refundId)
    WalletService->>DB: cộng walletBalance, lưu WalletTransaction REFUND_IN
    OrdersService->>DB: Order thành CANCELLED, ghi cancelReason, người hủy (cancelledByUserId) và lý do (cancelNote)
    opt Đơn có dùng mã khuyến mãi
      OrdersService->>PromotionsService: releaseUsage(orderId)
      PromotionsService->>DB: ghi releasedAt, trả lại lượt dùng mã (mã riêng dùng lại được nếu còn hạn)
    end
    OrdersService->>ProductsService: releaseStock(items)
    ProductsService->>DB: cộng lại stockRemaining nếu stockDate là hôm nay và đơn tạo hôm nay, không vượt dailyQuota (BR50)
    OrdersService->>LoyaltyService: revoke(orderId)
    LoyaltyService->>DB: trừ loyaltyPoints bằng Order.pointsAwarded và totalCups bằng số ly của đơn, không xuống dưới 0 (BR51)
  end
```

Kết quả trả về là đơn đã `CANCELLED`. Hủy đơn chỉ có hai lý do: `CUSTOMER_CANCEL` và `STAFF_CANCEL`. Đơn đã hủy lưu sẵn **ai hủy và vì sao**, quản lý xem lại ở danh sách đơn lọc `CANCELLED` và chi tiết đơn (`Sequence-09-XuLyDon`), kể cả các món trong đơn.
