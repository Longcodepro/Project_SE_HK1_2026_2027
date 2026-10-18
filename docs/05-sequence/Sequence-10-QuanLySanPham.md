# 05 · Sequence 10 — Quản lý sản phẩm và số ly bán trong ngày (UC39–UC47, UC76, UC77)

Phủ: UC39 Đặt hết bán / còn bán (Nhân viên, Quản lý), UC40 Xem danh sách, UC41 Thêm mới (include UC42 size/giá, UC43 topping, UC44 mức đá, UC45 mức đường), UC46 Cập nhật, UC47 Khóa bán / mở lại (chỉ Quản lý), UC76 Thiết lập số ly bán trong ngày và UC77 Dùng lại số ly của hôm qua (chỉ Quản lý). Quy tắc: BR01, BR02, BR18, BR20, BR33, BR49. Món có **một trạng thái** `status`: `ON_SALE` còn bán, `SOLD_OUT` hết bán (vẫn hiện nhưng mờ, không đặt được), `LOCKED` khóa bán (ẩn khỏi menu).

```mermaid
sequenceDiagram
  autonumber
  actor Manager as Quản lý
  actor Staff as Nhân viên
  participant AdminProductsPage
  participant ProductsController
  participant ProductsService
  participant DB

  Note over Manager,DB: UC40 Xem danh sách sản phẩm
  Manager->>AdminProductsPage: load(query)
  AdminProductsPage->>ProductsController: GET /admin/products
  ProductsController->>ProductsService: listAll(query)
  ProductsService->>DB: đọc mọi sản phẩm, kể cả hết bán và khóa bán
  ProductsService-->>AdminProductsPage: 200 danh sách

  Note over Manager,DB: UC41 Thêm sản phẩm mới, include UC42 đến UC45
  Manager->>AdminProductsPage: onCreate(form)
  AdminProductsPage->>ProductsController: POST /admin/products
  ProductsController->>ProductsService: create(dto)
  ProductsService->>ProductsService: assertLevelsValid(dto)
  ProductsService->>ProductsService: assertToppingsExist(toppingIds)
  ProductsService->>ProductsService: assertToppingLimitsValid(dto)
  alt Thiếu size, giá âm, size trùng, đá hoặc đường sai min default max
    ProductsService-->>AdminProductsPage: 400
  else Danh mục hoặc topping không tồn tại
    ProductsService-->>AdminProductsPage: 404
  else Hợp lệ
    ProductsService->>DB: lưu Product, ProductSize kèm dung tích ml (UC42), ProductTopping kèm giới hạn số phần topping (UC43), mức đá và nhiệt độ nóng/lạnh được phép (UC44), mức đường (UC45)
    ProductsService-->>AdminProductsPage: 201 sản phẩm
  end

  Note over Manager,DB: UC46 Cập nhật thông tin sản phẩm
  Manager->>AdminProductsPage: onUpdate(productId, form)
  AdminProductsPage->>ProductsController: PATCH /admin/products/:id
  ProductsController->>ProductsService: update(productId, dto)
  ProductsService->>ProductsService: assertLevelsValid(dto)
  ProductsService->>ProductsService: assertToppingsExist(toppingIds)
  ProductsService->>ProductsService: assertToppingLimitsValid(dto)
  ProductsService->>DB: cập nhật Product, thay danh sách size và topping bằng danh sách gửi lên
  ProductsService-->>AdminProductsPage: 200 sản phẩm (404 nếu không có)

  Note over Manager,DB: UC47 Khóa bán hoặc mở lại sản phẩm (chỉ Quản lý)
  Manager->>AdminProductsPage: onToggleLocked(productId, isLocked)
  AdminProductsPage->>ProductsController: PATCH /admin/products/:id/lock
  ProductsController->>ProductsService: setLocked(productId, isLocked)
  ProductsService->>DB: status thành LOCKED (khóa bán) hoặc ON_SALE (mở lại)
  ProductsService-->>AdminProductsPage: 200

  Note over Manager,DB: UC76 Thiết lập số ly bán trong ngày
  Manager->>AdminProductsPage: onSetDailyStock(productId, quantity)
  AdminProductsPage->>ProductsController: PUT /admin/products/:id/daily-stock
  ProductsController->>ProductsService: setDailyStock(productId, quantity)
  ProductsService->>DB: đặt dailyQuota và stockRemaining bằng quantity, stockDate là hôm nay, tăng stockVersion
  ProductsService-->>AdminProductsPage: 200 (404 nếu không có sản phẩm)

  Note over Manager,DB: UC77 Dùng lại số ly của hôm qua
  Manager->>AdminProductsPage: onReuseYesterdayStock()
  AdminProductsPage->>ProductsController: POST /admin/products/daily-stock/reuse
  ProductsController->>ProductsService: reuseYesterdayStock()
  ProductsService->>DB: mọi món chưa khóa: stockRemaining bằng dailyQuota, stockDate là hôm nay
  ProductsService-->>AdminProductsPage: 200 số món đã đặt lại

  Note over Staff,DB: UC39 Đặt hết bán hoặc còn bán, Nhân viên cũng được
  Staff->>AdminProductsPage: onSetSaleStatus(productId, status)
  AdminProductsPage->>ProductsController: PATCH /admin/products/:id/sale-status
  ProductsController->>ProductsService: setSaleStatus(productId, status)
  alt Món đang LOCKED
    ProductsService-->>AdminProductsPage: 409
  else Hợp lệ
    ProductsService->>DB: status thành SOLD_OUT (hết bán) hoặc ON_SALE (còn bán)
    ProductsService-->>AdminProductsPage: 200
  end
  Note over ProductsService,DB: Có hiệu lực tức thời (BR20): server không cache, OrdersService.createOrder đọc DB mỗi lần
```

Route `/admin/products*` yêu cầu `MANAGER`, riêng `PATCH /admin/products/:id/sale-status` và `GET /admin/products` cho phép `STAFF` và `MANAGER` (BR18, BR33), vì nhân viên phải xem danh sách mới chọn được món để đặt hết bán.
