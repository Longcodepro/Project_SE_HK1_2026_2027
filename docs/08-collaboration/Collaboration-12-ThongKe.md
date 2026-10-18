# 08 · Collaboration 12 — Thống kê báo cáo (UC64–UC67)

Cùng nội dung với `05-sequence/Sequence-12-ThongKe.md`. Số 1 doanh thu, 2 sản phẩm bán chạy, 3 topping được chọn nhiều, 4 số đơn theo trạng thái. Chỉ `MANAGER`.

```mermaid
flowchart LR
  Manager[":Manager"]
  AP[":AdminStatsPage"]
  SC[":StatsController"]
  SS[":StatsService"]

  Manager -->|"1: loadRevenue(from, to, groupBy)"| AP
  AP -->|"1.1: revenue(query)"| SC
  SC -->|"1.1.1: revenueByPeriod(from, to, groupBy)"| SS
  Manager -->|"2: loadTopProducts(from, to)"| AP
  AP -->|"2.1: topProducts(query)"| SC
  SC -->|"2.1.1: topProducts(from, to, limit)"| SS
  Manager -->|"3: loadTopToppings(from, to)"| AP
  AP -->|"3.1: topToppings(query)"| SC
  SC -->|"3.1.1: topToppings(from, to, limit)"| SS
  Manager -->|"4: loadOrdersByStatus()"| AP
  AP -->|"4.1: ordersByStatus()"| SC
  SC -->|"4.1.1: countByStatus()"| SS
```

| Số | UC | Ghi chú |
|---|---|---|
| 1.1.1 | UC64 | Chỉ đơn `PAID`, `PREPARING`, `READY`, `COMPLETED` (BR21). `from` sau `to` trả 400 |
| 2.1.1 | UC65 | Theo tổng `quantity` của các dòng |
| 3.1.1 | UC66 | Theo tổng số phần đã chọn, nhân `quantity` của dòng |
| 4.1.1 | UC67 | Đủ 7 trạng thái, kể cả 0 |
