# 07 · Activity 02 — Nhân viên xử lý đơn từ nhận đến giao

Luồng của nhân viên, nối UC30 đến UC37 (xử lý món không làm được UC74 ở `Activity-03-HuyDonVaPhanHoi.md`). Hủy đơn và phản hồi dịch vụ chi tiết ở `Activity-03-HuyDonVaPhanHoi.md`. Chi tiết gọi hàm ở `05-sequence/Sequence-09-XuLyDon.md`.

```mermaid
flowchart TD
  S((Bắt đầu)) --> A1["UC30 Xem danh sách đơn: AdminOrdersPage.load"]
  A1 --> A2{"Lọc theo trạng thái?"}
  A2 -- "Có UC31" --> A3["AdminOrdersPage.load với status"] --> A4
  A2 -- "Không" --> A4["Chọn một đơn"]
  A4 --> B1["UC32 Xem chi tiết: AdminOrdersPage.onOpen, OrdersService.getDetail"]
  B1 --> B2["UC33 Xem thanh toán và hoàn tiền: PaymentsService.getByOrder"]
  B2 --> C1{"Trạng thái đơn?"}
  C1 -- "PAID" --> D1{"Cần làm gì?"}
  D1 -- "Làm món" --> D2["UC34 AdminOrdersPage.onChangeStatus: PREPARING"]
  D1 -- "Hủy" --> D4["UC36 AdminOrdersPage.onCancel"]
  D2 --> E1["Chuẩn bị xong: AdminOrdersPage.onChangeStatus: READY"]
  E1 --> E2["Sinh pickupCode: OrdersService.generatePickupCode"]
  E2 --> E3["Báo nước xong ORDER_READY kèm mã nhận hàng: NotificationService.notifyOrderEvent"]
  E3 --> F1["Khách đến quầy đưa mã"]
  F1 --> F2["UC35 Tra cứu mã: AdminOrdersPage.onLookupPickup"]
  F2 --> F3{"Có đơn với mã này?"}
  F3 -- "Không: 404" --> F1
  F3 -- "Có" --> F4["AdminOrdersPage.onDeliver, OrdersService.complete"]
  F4 --> F5{"Đơn READY và mã khớp?"}
  F5 -- "Không: 409 hoặc 422" --> F1
  F5 -- "Có" --> G1["Order COMPLETED"]
  G1 --> G2["Gửi lời cảm ơn ORDER_COMPLETED: NotificationService.notifyOrderEvent"] --> Z((Kết thúc))
  C1 -- "PREPARING" --> E1
  C1 -- "READY" --> F1
  C1 -- "PENDING, PAYMENT_FAILED" --> D5["Chỉ xem hoặc hủy UC36"] --> D4
  C1 -- "COMPLETED, CANCELLED" --> Z
  D4 --> Z
```

Nhân viên không đẩy được `PENDING` hoặc `PAYMENT_FAILED` sang `PAID` (chỉ thanh toán mới làm được), và `OrdersService.updateStatus` chỉ cho `PAID → PREPARING`, `PREPARING → READY` (BR12).
