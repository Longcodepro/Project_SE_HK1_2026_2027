# 05 · Sequence 08 — Phản hồi dịch vụ (UC28, UC37)

Phủ: UC28 Khách gửi phản hồi dịch vụ theo thang 5 sao sau khi đã nhận hàng, UC37 Nhân viên và Quản lý xem phản hồi. Quy tắc: BR14, BR15, BR18. Collaboration tương ứng: `08-collaboration/Collaboration-03-PhanHoiDichVu.md`.

Khách có trách nhiệm kiểm hàng tại quầy: thiếu món thì nói trực tiếp với nhân viên, không báo qua app. Phản hồi qua app chỉ là đánh giá và ghi nhận, **không tự hoàn tiền**.

## A. Khách gửi phản hồi (UC28)

```mermaid
sequenceDiagram
  autonumber
  actor Customer as Khách hàng
  participant OrderDetailPage
  participant OrdersController
  participant FeedbackService
  participant OrdersService
  participant DB

  Customer->>OrderDetailPage: onSubmitFeedback(rating, comment)
  OrderDetailPage->>OrdersController: POST /orders/:id/feedback
  OrdersController->>FeedbackService: submit(userId, orderId, dto)
  FeedbackService->>OrdersService: getByUser(userId, orderId)
  alt Đơn không phải của khách
    OrdersService-->>OrderDetailPage: 404
  else Đơn chưa COMPLETED
    FeedbackService-->>OrderDetailPage: 409
  else Đơn đã có phản hồi
    FeedbackService-->>OrderDetailPage: 409
  else rating ngoài 1 đến 5 hoặc comment quá dài
    FeedbackService-->>OrderDetailPage: 400
  else Hợp lệ
    FeedbackService->>DB: lưu ServiceFeedback (rating, comment)
    FeedbackService-->>OrderDetailPage: 201 phản hồi
  end
```

## B. Nhân viên xem phản hồi (UC37)

```mermaid
sequenceDiagram
  autonumber
  actor Staff as Nhân viên
  participant AdminFeedbackPage
  participant FeedbackController
  participant FeedbackService
  participant DB

  Staff->>AdminFeedbackPage: load(query)
  AdminFeedbackPage->>FeedbackController: GET /admin/feedback
  FeedbackController->>FeedbackService: listAll(query)
  FeedbackService->>DB: đọc phản hồi kèm mã đơn, tên khách, số sao, lọc theo số sao nếu có, mới nhất trước
  FeedbackService-->>AdminFeedbackPage: 200 danh sách phản hồi
```

Phản hồi của một đơn cũng hiện ở chi tiết đơn của nhân viên (`Sequence-09-XuLyDon`) và của khách (`Sequence-06-TheoDoiDon`). Route `/admin/feedback` yêu cầu `STAFF` hoặc `MANAGER`.
