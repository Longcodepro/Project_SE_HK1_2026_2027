# 05 · Sequence 05 — Thanh toán (UC21–UC23, cộng điểm BFD 7.1)

Phủ: UC21 Chọn phương thức, UC22 Thực hiện giao dịch thanh toán (include UC21, tác nhân phụ Cổng mock), UC23 Thử lại khi thất bại (extend UC22), và bước hệ thống cộng điểm sau `PAID`. Quy tắc: BR09, BR10, BR11, BR38, BR40, BR41. Collaboration tương ứng: `08-collaboration/Collaboration-02-ThanhToan.md`.

```mermaid
sequenceDiagram
  autonumber
  actor Customer as Khách hàng
  participant PaymentPage
  participant OrdersController
  participant PaymentsController
  participant PaymentsService
  participant PaymentGateway
  participant OrdersService
  participant LoyaltyService
  participant NotificationService
  participant PromotionsService
  participant DB

  Customer->>PaymentPage: load(orderId)
  PaymentPage->>OrdersController: GET /orders/:id
  OrdersController->>OrdersService: getByUser(userId, orderId)
  OrdersService-->>PaymentPage: 200 đơn và tổng tiền

  Note over Customer,DB: UC21 Chọn phương thức thanh toán
  Customer->>PaymentPage: selectMethod(method)
  Note over PaymentPage: EWALLET chỉ xác nhận. CARD: nhập số thẻ, tên, hạn, CVV (không lưu, chỉ giữ 4 số cuối). TRANSFER: hiện mã tham chiếu, hiệu lực 10 phút (BR41)

  Note over Customer,DB: UC22 Thực hiện giao dịch thanh toán
  Customer->>PaymentPage: onPay()
  PaymentPage->>PaymentPage: newIdempotencyKey()
  PaymentPage->>PaymentsController: POST /payments
  PaymentsController->>PaymentsService: pay(userId, dto, idempotencyKey)
  Note over PaymentsService: Cả hàm pay chạy trong một giao dịch khóa dòng đơn (BR10), nên hai yêu cầu cùng key đến cùng lúc không gọi cổng hai lần
  PaymentsService->>PaymentsService: findByKey(idempotencyKey)
  alt Key đã dùng cho đơn hoặc khách khác
    PaymentsService-->>PaymentPage: 409
  else Key đã dùng cho đúng đơn này
    PaymentsService-->>PaymentPage: 200 kết quả cũ, không gọi cổng lần nữa
  else Key mới
    PaymentsService->>OrdersService: getByUser(userId, orderId)
    alt Đơn không phải của khách
      OrdersService-->>PaymentPage: 404
    else Đơn không ở PENDING hoặc PAYMENT_FAILED
      PaymentsService-->>PaymentPage: 409
    else Hợp lệ
      PaymentsService->>PaymentGateway: charge(amount, method, idempotencyKey)
      PaymentGateway-->>PaymentsService: success hoặc failed kèm gatewayRef
      Note over PaymentGateway: CARD theo số thẻ thử (4111... luôn thành công, 4000...0002 luôn bị từ chối). TRANSFER tự xác nhận sau vài giây, quá 10 phút chưa xác nhận thì failed
      PaymentsService->>DB: lưu Payment SUCCESS hoặc FAILED (kèm 4 số cuối thẻ hoặc mã tham chiếu và hạn chuyển khoản)
      alt Thành công
        PaymentsService->>OrdersService: markPaid(orderId)
        OrdersService->>DB: Order PENDING hoặc PAYMENT_FAILED thành PAID
        OrdersService->>NotificationService: notifyOrderEvent(orderId, event)
        Note over NotificationService: event = PAYMENT_SUCCESS: SMS ngắn (mã đơn + mã giao dịch) và email hóa đơn nếu khách có email (Sequence-14, BR38)
        PaymentsService->>LoyaltyService: award(orderId)
        LoyaltyService->>LoyaltyService: getSettings()
        LoyaltyService->>LoyaltyService: calcPoints(totalAmount)
        LoyaltyService->>DB: cộng loyaltyPoints và totalCups (số ly của đơn) cho User, ghi Order.pointsAwarded
        LoyaltyService->>LoyaltyService: grantRewards(userId)
        opt Khách đạt thêm mốc điểm hoặc mốc ly của một quy tắc thưởng đang bật
          LoyaltyService->>PromotionsService: issueReward(rule, userId)
          PromotionsService->>DB: tạo mã riêng PERSONAL cho khách, có hạn dùng
          LoyaltyService->>NotificationService: notifyReward(userId, promotion)
          Note over NotificationService: event = REWARD_ISSUED, SMS báo mã thưởng (Sequence-14)
        end
        PaymentsService-->>PaymentPage: 200 payment SUCCESS và order PAID
        Note over PaymentPage: Hiện mã đơn và chuyển sang OrderDetailPage
      else Thất bại
        PaymentsService->>OrdersService: markPaymentFailed(orderId)
        OrdersService->>DB: Order thành PAYMENT_FAILED
        PaymentsService-->>PaymentPage: 200 payment FAILED và order PAYMENT_FAILED
        Note over PaymentPage: Hiện nút Thử lại
      end
    end
  end

  opt UC23 Thử lại khi thanh toán thất bại
    Customer->>PaymentPage: onRetry()
    Note over PaymentPage: Gọi lại onPay() với Idempotency-Key mới, lặp UC22
  end
```

Lần `charge` thất bại vẫn lưu một dòng `Payment` `FAILED`, nên `Order` có thể có nhiều `Payment` (UC33 sẽ thấy hết).
