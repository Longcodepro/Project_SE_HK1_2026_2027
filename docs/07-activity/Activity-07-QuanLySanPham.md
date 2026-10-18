# 07 · Activity 07 — Quản lý sản phẩm (UC39–UC47, UC76, UC77, BFD nhóm 8)

Quản lý làm toàn bộ; Nhân viên chỉ làm UC39. Chi tiết gọi hàm ở `05-sequence/Sequence-10-QuanLySanPham.md`. Quy tắc: BR01, BR02, BR18, BR20.

```mermaid
flowchart TD
  S((Bắt đầu)) --> A1["UC40 Xem danh sách: AdminProductsPage.load, ProductsService.listAll"]
  A1 --> B0{"Thao tác?"}
  B0 -- "Thêm mới UC41" --> C1["AdminProductsPage.onCreate"]
  C1 --> C2["Nhập thông tin cơ bản và chọn danh mục"]
  C2 --> C3["UC42 Thiết lập size và giá"]
  C3 --> C4["UC43 Chọn topping áp dụng"]
  C4 --> C5["UC44 Đặt mức đá min, max, mặc định"]
  C5 --> C6["UC45 Đặt mức đường min, max, mặc định"]
  C6 --> C7["ProductsService.create"]
  C7 --> C8["ProductsService.assertLevelsValid, ProductsService.assertToppingsExist, ProductsService.assertToppingLimitsValid"]
  C8 --> C9{"Hợp lệ?"}
  C9 -- "Sai min default max, thiếu size, giá âm: 400" --> C2
  C9 -- "Danh mục hoặc topping không có: 404" --> C2
  C9 -- "Có" --> C10["Lưu Product, ProductSize, ProductTopping"] --> A1
  B0 -- "Cập nhật UC46" --> D1["AdminProductsPage.onUpdate, ProductsService.update"]
  D1 --> D2["Kiểm như thêm mới, thay danh sách size và topping bằng danh sách gửi lên"] --> A1
  B0 -- "Khóa bán hoặc mở lại UC47 (chỉ Quản lý)" --> E1["AdminProductsPage.onToggleLocked, ProductsService.setLocked"]
  E1 --> E2["status thành LOCKED (biến khỏi menu) hoặc về ON_SALE"] --> A1
  B0 -- "Hết bán hoặc còn bán UC39" --> F1["AdminProductsPage.onSetSaleStatus, ProductsService.setSaleStatus"]
  F1 --> F2{"Món đang LOCKED?"}
  F2 -- "Có: 409" --> A1
  F2 -- "Không" --> F3["status giữa ON_SALE và SOLD_OUT, hiệu lực tức thời: hết bán vẫn hiện nhưng mờ"] --> A1
  B0 -- "Nhập số ly trong ngày UC76" --> H1["AdminProductsPage.onSetDailyStock, ProductsService.setDailyStock"]
  H1 --> H2["dailyQuota và stockRemaining bằng số nhập, stockDate là hôm nay"] --> A1
  B0 -- "Dùng lại như hôm qua UC77" --> I1["AdminProductsPage.onReuseYesterdayStock, ProductsService.reuseYesterdayStock"]
  I1 --> I2["Mọi món chưa khóa: stockRemaining bằng dailyQuota, stockDate là hôm nay"] --> A1
  B0 -- "Xong" --> Z((Kết thúc))
```
