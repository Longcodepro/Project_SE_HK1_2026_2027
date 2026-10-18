# 08 · Collaboration 09 — Nhân viên xử lý đơn (UC30–UC35)

Cùng nội dung với `05-sequence/Sequence-09-XuLyDon.md`. Số 1 danh sách, 2 chi tiết, 3 đổi trạng thái, 4 tra mã nhận hàng, 5 giao món.

```mermaid
flowchart LR
  Staff[":Staff"]
  AP[":AdminOrdersPage"]
  OC[":OrdersController"]
  OS[":OrdersService"]
  PS[":PaymentsService"]
  FS[":FeedbackService"]
  NS[":NotificationService"]

  Staff -->|"1: load(status)"| AP
  AP -->|"1.1: adminList(query)"| OC
  OC -->|"1.1.1: listAll(query)"| OS
  Staff -->|"2: onOpen(orderId)"| AP
  AP -->|"2.1: adminGetOne(id)"| OC
  OC -->|"2.1.1: getDetail(orderId)"| OS
  OS -->|"2.1.1.1: getByOrder(orderId)"| PS
  OS -->|"2.1.1.2: getByOrder(orderId)"| FS
  Staff -->|"3: onChangeStatus(orderId, status)"| AP
  AP -->|"3.1: adminUpdateStatus(id, dto)"| OC
  OC -->|"3.1.1: updateStatus(orderId, status)"| OS
  OS -->|"3.1.1.1: assertTransition(from, to)"| OS
  OS -->|"3.1.1.2: generatePickupCode()"| OS
  OS -->|"3.1.1.3: notifyOrderEvent(orderId, event)"| NS
  Staff -->|"4: onLookupPickup(code)"| AP
  AP -->|"4.1: adminFindByPickupCode(code)"| OC
  OC -->|"4.1.1: findByPickupCode(code)"| OS
  Staff -->|"5: onDeliver(orderId, pickupCode)"| AP
  AP -->|"5.1: adminComplete(id, dto)"| OC
  OC -->|"5.1.1: complete(orderId, pickupCode)"| OS
  OS -->|"5.1.1.1: notifyOrderEvent(orderId, event)"| NS
```

| Số | UC | Ghi chú |
|---|---|---|
| 1.1.1 | UC30, UC31 | `status` rỗng thì lấy tất cả |
| 2.1.1.1 | UC32, UC33 | Chi tiết đơn kèm các `Payment` và `Refund` |
| 2.1.1.2 | UC32 | Kèm phản hồi dịch vụ của khách nếu có (BR14) |
| 3.1.1.1 | UC34 | Chỉ cho `PAID → PREPARING` và `PREPARING → READY`, ngoài ra 409 (BR12) |
| 3.1.1.2 | UC34 | Chỉ khi đích là `READY` |
| 3.1.1.3 | UC34 | Chỉ khi đích là `READY`: gửi thông báo `ORDER_READY` kèm mã nhận hàng (BR28) |
| 5.1.1.1 | UC35 | Gửi thông báo `ORDER_COMPLETED`, lời cảm ơn sau khi nhận món (BR28) |
| 4.1.1 và 5.1.1 | UC35 | Đơn phải `READY` (409), mã gửi lên phải khớp (422) |
