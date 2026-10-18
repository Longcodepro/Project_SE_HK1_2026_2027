# 08 · Collaboration 10 — Quản lý sản phẩm và số ly bán trong ngày (UC39–UC47, UC76, UC77)

Cùng nội dung với `05-sequence/Sequence-10-QuanLySanPham.md`. Số 1 xem danh sách, 2 thêm mới, 3 cập nhật, 4 khóa bán / mở lại (chỉ Quản lý), 5 đặt hết bán / còn bán (Nhân viên cũng làm được), 6 thiết lập số ly bán trong ngày, 7 dùng lại số ly của hôm qua (chỉ Quản lý).

```mermaid
flowchart LR
  Manager[":Manager"]
  Staff[":Staff"]
  AP[":AdminProductsPage"]
  PC[":ProductsController"]
  PS[":ProductsService"]

  Manager -->|"1: load(query)"| AP
  AP -->|"1.1: adminList(query)"| PC
  PC -->|"1.1.1: listAll(query)"| PS
  Manager -->|"2: onCreate(form)"| AP
  AP -->|"2.1: create(dto)"| PC
  PC -->|"2.1.1: create(dto)"| PS
  PS -->|"2.1.1.1: assertLevelsValid(dto)"| PS
  PS -->|"2.1.1.2: assertToppingsExist(toppingIds)"| PS
  PS -->|"2.1.1.3: assertToppingLimitsValid(dto)"| PS
  Manager -->|"3: onUpdate(productId, form)"| AP
  AP -->|"3.1: update(id, dto)"| PC
  PC -->|"3.1.1: update(productId, dto)"| PS
  PS -->|"3.1.1.1: assertLevelsValid(dto)"| PS
  PS -->|"3.1.1.2: assertToppingsExist(toppingIds)"| PS
  PS -->|"3.1.1.3: assertToppingLimitsValid(dto)"| PS
  Manager -->|"4: onToggleLocked(productId, isLocked)"| AP
  AP -->|"4.1: setLocked(id, dto)"| PC
  PC -->|"4.1.1: setLocked(productId, isLocked)"| PS
  Staff -->|"5: onSetSaleStatus(productId, status)"| AP
  AP -->|"5.1: setSaleStatus(id, dto)"| PC
  PC -->|"5.1.1: setSaleStatus(productId, status)"| PS
  Manager -->|"6: onSetDailyStock(productId, quantity)"| AP
  AP -->|"6.1: setDailyStock(id, dto)"| PC
  PC -->|"6.1.1: setDailyStock(productId, quantity)"| PS
  Manager -->|"7: onReuseYesterdayStock()"| AP
  AP -->|"7.1: reuseDailyStock()"| PC
  PC -->|"7.1.1: reuseYesterdayStock()"| PS
```

| Số | UC | Ghi chú |
|---|---|---|
| 2.1.1.1 | UC44, UC45 | `0 ≤ min ≤ default ≤ max ≤ 100` cho cả đá và đường. Nhiệt độ: ít nhất một trong nóng, lạnh; mặc định phải thuộc nhiệt độ được phép (BR35). Chỉ cho một nhiệt độ thì ô chọn nóng/lạnh bị khóa ở trang chi tiết |
| 2.1.1.2 | UC43 | Mọi `toppingId` phải tồn tại, sai thì 404 |
| 2.1.1.3 và 3.1.1.3 | UC43 | Giới hạn topping: món có topping thì `1 ≤ maxPerTopping ≤ maxToppingTotal ≤ 10`, không có topping thì cả hai bằng 0, sai thì 400 (BR37) |
| 2 và 3 | UC41 (UC42–UC45), UC46 | Size, giá và dung tích ml (UC42) nằm trong `dto.sizes`, kiểm trong `create` và `update` |
| 4.1.1 | UC47 | `status` thành `LOCKED` hoặc về `ON_SALE`. Chỉ `MANAGER` (BR33) |
| 6.1.1 | UC76 | `dailyQuota` và `stockRemaining` bằng `quantity`, `stockDate` là hôm nay. Chỉ `MANAGER` (BR49) |
| 7.1.1 | UC77 | Mọi món chưa khóa: `stockRemaining` bằng `dailyQuota`, `stockDate` là hôm nay (BR49) |
| 5.1.1 | UC39 | `status` giữa `ON_SALE` và `SOLD_OUT`, món `LOCKED` thì 409. Hiệu lực tức thời (BR20). Cho phép `STAFF` và `MANAGER` |
