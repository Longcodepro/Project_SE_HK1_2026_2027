# 08 · Collaboration 03 — Phản hồi dịch vụ (UC28, UC37)

Cùng nội dung với `05-sequence/Sequence-08-PhanHoiDichVu.md`, nhìn theo liên kết đối tượng. Số 1 khách gửi phản hồi, 2 nhân viên xem danh sách phản hồi.

```mermaid
flowchart LR
  Customer[":Customer"]
  Staff[":Staff"]
  DP[":OrderDetailPage"]
  AF[":AdminFeedbackPage"]
  OC[":OrdersController"]
  FC[":FeedbackController"]
  FS[":FeedbackService"]
  OS[":OrdersService"]

  Customer -->|"1: onSubmitFeedback(rating, comment)"| DP
  DP -->|"1.1: submitFeedback(req, id, dto)"| OC
  OC -->|"1.1.1: submit(userId, orderId, dto)"| FS
  FS -->|"1.1.1.1: getByUser(userId, orderId)"| OS
  Staff -->|"2: load(query)"| AF
  AF -->|"2.1: adminList(query)"| FC
  FC -->|"2.1.1: listAll(query)"| FS
```

| Số | Ghi chú |
|---|---|
| 1.1.1 | Chỉ đơn `COMPLETED`, mỗi đơn một phản hồi, `rating` từ 1 đến 5 (BR14) |
| 1.1.1.1 | Đơn không phải của khách thì 404 |
| 2.1.1 | Lọc theo số sao, mới nhất trước. `STAFF` và `MANAGER` |
