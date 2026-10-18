# 05 · Sequence 12 — Thống kê báo cáo (UC64–UC67)

Phủ: UC64 Doanh thu theo thời gian, UC65 Sản phẩm bán chạy, UC66 Topping được chọn nhiều, UC67 Số đơn theo trạng thái. Chỉ `MANAGER`. Quy tắc: BR21 (chỉ tính đơn `PAID`, `PREPARING`, `READY`, `COMPLETED`, riêng UC67 đếm cả 7 trạng thái).

```mermaid
sequenceDiagram
  autonumber
  actor Manager as Quản lý
  participant AdminStatsPage
  participant StatsController
  participant StatsService
  participant DB

  Manager->>AdminStatsPage: loadRevenue(from, to, groupBy)
  AdminStatsPage->>StatsController: GET /admin/stats/revenue
  StatsController->>StatsService: revenueByPeriod(from, to, groupBy)
  StatsService->>DB: tổng totalAmount của đơn hợp lệ, nhóm theo ngày hoặc tháng
  StatsService-->>AdminStatsPage: 200 chuỗi thời gian (UC64)

  Manager->>AdminStatsPage: loadTopProducts(from, to)
  AdminStatsPage->>StatsController: GET /admin/stats/top-products
  StatsController->>StatsService: topProducts(from, to, limit)
  StatsService->>DB: tổng quantity theo sản phẩm
  StatsService-->>AdminStatsPage: 200 xếp hạng (UC65)

  Manager->>AdminStatsPage: loadTopToppings(from, to)
  AdminStatsPage->>StatsController: GET /admin/stats/top-toppings
  StatsController->>StatsService: topToppings(from, to, limit)
  StatsService->>DB: tổng số phần OrderItemTopping theo topping, nhân quantity của dòng
  StatsService-->>AdminStatsPage: 200 xếp hạng (UC66)

  Manager->>AdminStatsPage: loadOrdersByStatus()
  AdminStatsPage->>StatsController: GET /admin/stats/orders-by-status
  StatsController->>StatsService: countByStatus()
  StatsService->>DB: đếm đơn theo status, đủ 7 trạng thái kể cả 0
  StatsService-->>AdminStatsPage: 200 số đơn theo trạng thái (UC67)
```

Dữ liệu sai (`from` sau `to`, `groupBy` ngoài `day`/`month`) trả 400.
