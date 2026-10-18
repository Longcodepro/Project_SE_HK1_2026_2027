# 07 · Activity 06 — Theo dõi đơn hàng và điểm (UC24–UC29 trừ hủy và phản hồi, BFD nhóm 6 và 7)

Hủy đơn (UC27) và phản hồi dịch vụ (UC28) ở `Activity-03-HuyDonVaPhanHoi.md`. Chi tiết gọi hàm ở `05-sequence/Sequence-06-TheoDoiDon.md`. Quy tắc: BR11, BR12, BR23, BR24.

```mermaid
flowchart TD
  S((Bắt đầu: Khách hàng đã đăng nhập)) --> A0{"Muốn xem gì?"}
  A0 -- "Lịch sử UC24" --> B1["OrderHistoryPage.load, OrdersService.listByUser"]
  B1 --> B2{"Có đơn?"}
  B2 -- "Không" --> B3["Hiện trạng thái rỗng"] --> Z((Kết thúc))
  B2 -- "Có" --> B4["Chọn một đơn"] --> C1
  A0 -- "Một đơn cụ thể" --> C1["UC25 OrderDetailPage.load, OrdersService.getByUser"]
  C1 --> C2{"Đơn của khách này?"}
  C2 -- "Không: 404" --> Z
  C2 -- "Có" --> D1["Hiện dòng, topping, giảm giá, tổng, trạng thái"]
  D1 -.-> H1["Đơn đã thanh toán: OrderDetailPage.openBill, OrdersService.getBill, BillService.buildBill"]
  D1 --> E1{"Đơn đã COMPLETED hoặc CANCELLED?"}
  E1 -- "Rồi" --> Z
  E1 -- "Chưa" --> E2["Chờ 10 giây: OrderDetailPage.poll"]
  E2 --> F0{"Trạng thái hiện tại?"}
  F0 -- "READY" --> F1["UC26 Hiện pickupCode để nhận món"] --> E2
  F0 -- "COMPLETED" --> F2["Hiện khung đánh giá 1 đến 5 sao nếu chưa phản hồi UC28"] --> Z
  F0 -- "PENDING, PAYMENT_FAILED" --> F3["Gợi ý thanh toán hoặc thử lại UC23"] --> Z
  F0 -- "PAID, PREPARING" --> E2
  A0 -- "Điểm UC29" --> G1["ProfilePage.loadPoints, LoyaltyService.getBalance"]
  G1 --> G2["Hiện điểm, số ly và còn thiếu bao nhiêu tới mốc thưởng kế tiếp"] --> Z
  A0 -- "Mã giảm giá của tôi UC70" --> V1["ProfilePage.loadVouchers, PromotionsService.listMine"]
  V1 --> V2["Hiện mã riêng: còn dùng, đã dùng, hết hạn, và mã chung còn lượt"] --> Z
```
