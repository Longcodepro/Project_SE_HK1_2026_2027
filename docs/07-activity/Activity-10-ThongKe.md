# 07 · Activity 10 — Thống kê báo cáo (UC64–UC67, BFD nhóm 13)

Chi tiết gọi hàm ở `05-sequence/Sequence-12-ThongKe.md`. Chỉ `MANAGER`. Quy tắc: BR21 (chỉ tính đơn PAID, PREPARING, READY, COMPLETED; UC67 đếm cả 7 trạng thái).

```mermaid
flowchart TD
  S((Bắt đầu: Quản lý)) --> A0{"Xem báo cáo nào?"}
  A0 -- "Doanh thu UC64" --> B1["Chọn from, to, nhóm theo ngày hoặc tháng"]
  B1 --> B2{"Khoảng thời gian hợp lệ?"}
  B2 -- "Không: 400" --> B1
  B2 -- "Có" --> B3["AdminStatsPage.loadRevenue, StatsService.revenueByPeriod"]
  B3 --> B4["Tổng totalAmount theo kỳ"] --> R
  A0 -- "Sản phẩm bán chạy UC65" --> C1["AdminStatsPage.loadTopProducts, StatsService.topProducts"]
  C1 --> C2["Xếp hạng theo tổng quantity"] --> R
  A0 -- "Topping được chọn nhiều UC66" --> D1["AdminStatsPage.loadTopToppings, StatsService.topToppings"]
  D1 --> D2["Xếp hạng theo tổng số phần đã chọn"] --> R
  A0 -- "Số đơn theo trạng thái UC67" --> E1["AdminStatsPage.loadOrdersByStatus, StatsService.countByStatus"]
  E1 --> E2["Đủ 7 trạng thái, kể cả 0"] --> R
  R["Hiện bảng hoặc biểu đồ"] --> F0{"Xem báo cáo khác?"}
  F0 -- "Có" --> A0
  F0 -- "Không" --> Z((Kết thúc))
```
