# 08 · Collaboration 07 — Theo dõi đơn hàng, điểm và mã giảm giá (UC24, UC25, UC26, UC29, UC70)

Cùng nội dung với `05-sequence/Sequence-06-TheoDoiDon.md`. Số 1 lịch sử, 2 chi tiết, 3 polling, 4 điểm, 5 xem hóa đơn, 6 xem mã giảm giá của tôi.

```mermaid
flowchart LR
  Customer[":Customer"]
  OHP[":OrderHistoryPage"]
  ODP[":OrderDetailPage"]
  PP[":ProfilePage"]
  OC[":OrdersController"]
  OS[":OrdersService"]
  UC[":UsersController"]
  LS[":LoyaltyService"]
  BS[":BillService"]
  FS[":FeedbackService"]
  PRC[":PromotionsController"]
  PRS[":PromotionsService"]

  Customer -->|"1: load()"| OHP
  OHP -->|"1.1: listMine(req)"| OC
  OC -->|"1.1.1: listByUser(userId)"| OS
  Customer -->|"2: load(orderId)"| ODP
  ODP -->|"2.1: getMine(req, id)"| OC
  OC -->|"2.1.1: getByUser(userId, orderId)"| OS
  OS -->|"2.1.1.1: getByOrder(orderId)"| FS
  ODP -->|"3: poll()"| ODP
  ODP -->|"3.1: getMine(req, id)"| OC
  OC -->|"3.1.1: getByUser(userId, orderId)"| OS
  Customer -->|"4: loadPoints()"| PP
  PP -->|"4.1: getPoints(req)"| UC
  UC -->|"4.1.1: getBalance(userId)"| LS
  Customer -->|"5: openBill()"| ODP
  ODP -->|"5.1: getBill(req, id)"| OC
  OC -->|"5.1.1: getBill(userId, orderId)"| OS
  OS -->|"5.1.1.1: getByUser(userId, orderId)"| OS
  OS -->|"5.1.1.2: buildBill(order)"| BS
  Customer -->|"6: loadVouchers()"| PP
  PP -->|"6.1: listMine(req)"| PRC
  PRC -->|"6.1.1: listMine(userId)"| PRS
```

| Số | UC | Ghi chú |
|---|---|---|
| 1.1.1 | UC24 | Chỉ đơn của khách, mới nhất trước |
| 2.1.1 | UC25 | Đơn không phải của khách thì 404 |
| 2.1.1.1 | UC25 | Đính kèm phản hồi dịch vụ của đơn nếu có (BR14) |
| 3 đến 3.1.1 | UC26 | Cứ 10 giây gọi lại (BR24). Khi đơn `READY` thì hiện `pickupCode` |
| 4.1.1 | UC29 | Trả về điểm, số ly và còn thiếu bao nhiêu tới mốc thưởng kế tiếp. Điểm và ly chỉ cộng, không trừ (BR23, BR40) |
| 6 đến 6.1.1 | UC70 | Danh sách mã riêng của khách (còn dùng, đã dùng, hết hạn) và mã chung còn lượt |
| 5 đến 5.1.1.2 | UC25 | Xem hóa đơn của đơn đã thanh toán (BR38). Đơn chưa thanh toán thì 409. Bố cục ở `02-use_case/MauHoaDon.md` |
