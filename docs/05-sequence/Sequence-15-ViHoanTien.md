# 05 · Sequence 15 — Ví hoàn tiền và rút tiền (UC71, UC72, UC73)

Ví trên web của khách **chỉ nhận tiền hoàn** (hủy đơn, hoàn tiền món không làm được), **không dùng để thanh toán đơn**. Muốn lấy tiền ra, khách gửi yêu cầu rút kèm thông tin nhận, quản lý **chuyển thủ công** rồi đánh dấu đã xong. Quy tắc: BR43, BR44. Collaboration tương ứng: `08-collaboration/Collaboration-14-ViHoanTien.md`.

## A. Cộng tiền hoàn vào ví (do hệ thống chạy, từ UC38 và UC74)

```mermaid
sequenceDiagram
  autonumber
  participant OrdersService
  participant RefundsService
  participant WalletService
  participant DB

  OrdersService->>RefundsService: refund(order, amount, reason, actorId, note)
  RefundsService->>DB: lưu Refund
  RefundsService->>WalletService: credit(userId, amount, refundId)
  WalletService->>DB: walletBalance tăng amount, lưu WalletTransaction REFUND_IN
```

## B. Khách xem ví và gửi yêu cầu rút tiền (UC71, UC72)

```mermaid
sequenceDiagram
  autonumber
  actor Customer as Khách hàng
  participant WalletPage
  participant WalletController
  participant WalletService
  participant DB

  Customer->>WalletPage: load()
  WalletPage->>WalletController: GET /wallet
  WalletController->>WalletService: getWallet(userId)
  WalletService->>DB: đọc walletBalance và lịch sử biến động ví
  WalletService-->>WalletPage: 200 số dư và lịch sử (UC71)

  Customer->>WalletPage: onRequestWithdrawal(form)
  WalletPage->>WalletController: POST /wallet/withdrawals
  WalletController->>WalletService: requestWithdrawal(userId, dto)
  alt amount dưới 10.000, thiếu thông tin nhận, thiếu tên ngân hàng khi chọn thẻ hoặc tài khoản
    WalletService-->>WalletPage: 400
  else amount lớn hơn số dư
    WalletService-->>WalletPage: 422 Số dư không đủ
  else Hợp lệ
    WalletService->>DB: lưu WithdrawalRequest PENDING
    WalletService->>DB: trừ walletBalance ngay (giữ chỗ), lưu WalletTransaction WITHDRAW_OUT
    WalletService-->>WalletPage: 201 yêu cầu đang chờ quản lý xử lý (UC72)
  end

  Customer->>WalletPage: loadWithdrawals()
  WalletPage->>WalletController: GET /wallet/withdrawals
  WalletController->>WalletService: listMyWithdrawals(userId)
  WalletService-->>WalletPage: 200 các yêu cầu rút của khách kèm trạng thái
```

## C. Quản lý xử lý yêu cầu rút tiền (UC73)

```mermaid
sequenceDiagram
  autonumber
  actor Manager as Quản lý
  participant AdminWithdrawalsPage
  participant WalletController
  participant WalletService
  participant NotificationService
  participant DB

  Manager->>AdminWithdrawalsPage: load(query)
  AdminWithdrawalsPage->>WalletController: GET /admin/withdrawals
  WalletController->>WalletService: listAllWithdrawals(query)
  WalletService-->>AdminWithdrawalsPage: 200 danh sách yêu cầu, lọc theo trạng thái

  alt Đã chuyển khoản thủ công xong
    Manager->>AdminWithdrawalsPage: onComplete(withdrawalId, form)
    AdminWithdrawalsPage->>WalletController: PATCH /admin/withdrawals/:id/complete
    WalletController->>WalletService: completeWithdrawal(withdrawalId, managerId, dto)
    alt Yêu cầu không còn PENDING
      WalletService-->>AdminWithdrawalsPage: 409
    else Thiếu mã giao dịch
      WalletService-->>AdminWithdrawalsPage: 400
    else Hợp lệ
      WalletService->>DB: status COMPLETED, ghi transferRef, người xử lý, giờ xử lý
      WalletService->>NotificationService: notifyWithdrawal(userId, request)
    end
  else Từ chối yêu cầu
    Manager->>AdminWithdrawalsPage: onReject(withdrawalId, form)
    AdminWithdrawalsPage->>WalletController: PATCH /admin/withdrawals/:id/reject
    WalletController->>WalletService: rejectWithdrawal(withdrawalId, managerId, dto)
    alt Yêu cầu không còn PENDING
      WalletService-->>AdminWithdrawalsPage: 409
    else Thiếu lý do
      WalletService-->>AdminWithdrawalsPage: 400
    else Hợp lệ
      WalletService->>DB: status REJECTED, ghi rejectReason, người xử lý
      WalletService->>DB: trả lại walletBalance, lưu WalletTransaction WITHDRAW_RETURN
      WalletService->>NotificationService: notifyWithdrawal(userId, request)
    end
  end
```

Các route `/wallet*` yêu cầu `CUSTOMER`, `/admin/withdrawals*` yêu cầu `MANAGER`. Báo khách bằng SMS (và email nếu có) khi yêu cầu đã chuyển xong hoặc bị từ chối (`Sequence-14-ThongBao`).
