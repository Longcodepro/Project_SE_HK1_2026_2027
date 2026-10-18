# 05 · Sequence 02 — Xem menu (UC07–UC10)

Phủ: UC07 Xem danh sách menu, UC08 Tìm kiếm (extend), UC09 Lọc theo danh mục (extend), UC10 Xem chi tiết (gồm hiển thị sản phẩm hết bán, BFD 2.8). Quy tắc: BR01, BR02.

```mermaid
sequenceDiagram
  autonumber
  actor Guest as Khách vãng lai
  participant MenuPage
  participant ProductDetailPage
  participant CategoriesController
  participant CategoriesService
  participant ProductsController
  participant ProductsService
  participant DB

  Note over Guest,DB: UC07 Xem danh sách menu
  Guest->>MenuPage: load()
  MenuPage->>CategoriesController: GET /categories
  CategoriesController->>CategoriesService: listVisible()
  CategoriesService->>DB: đọc danh mục isVisible = true
  MenuPage->>ProductsController: GET /products
  ProductsController->>ProductsService: listVisible(query)
  ProductsService->>DB: đọc sản phẩm status là ON_SALE hoặc SOLD_OUT, và danh mục isVisible
  ProductsService-->>MenuPage: 200 danh sách kèm status
  Note over MenuPage: Sản phẩm SOLD_OUT (hết bán) hiện mờ

  opt UC08 Tìm kiếm theo tên
    loop Mỗi khi khách gõ
      Guest->>MenuPage: onType(text)
      MenuPage->>MenuPage: filterSuggestions(text)
      Note over MenuPage: Lọc ngay trên client từ danh sách món đã tải ở bước load(), tối đa 5 tên. Không gọi máy chủ
    end
    alt Khách chọn một gợi ý
      Guest->>MenuPage: onPickSuggestion(name)
      MenuPage->>MenuPage: onSearch(text)
    else Khách tự bấm Enter
      Guest->>MenuPage: onSearch(text)
    end
    MenuPage->>ProductsController: GET /products
    ProductsController->>ProductsService: listVisible(query)
    ProductsService->>DB: lọc tên chứa từ khóa, không phân biệt hoa thường
    ProductsService-->>MenuPage: 200 danh sách đã lọc
  end

  opt UC09 Lọc theo danh mục
    Guest->>MenuPage: onSelectCategory(categoryId)
    MenuPage->>ProductsController: GET /products
    ProductsController->>ProductsService: listVisible(query)
    ProductsService->>DB: lọc theo categoryId
    ProductsService-->>MenuPage: 200 danh sách đã lọc
  end

  Note over Guest,DB: UC10 Xem chi tiết sản phẩm
  Guest->>ProductDetailPage: load(productId)
  ProductDetailPage->>ProductsController: GET /products/:id
  ProductsController->>ProductsService: getVisibleDetail(productId)
  ProductsService->>DB: đọc sản phẩm kèm size, topping áp dụng, mức đá và đường
  alt Không có hoặc đang khóa bán (LOCKED)
    ProductsService-->>ProductDetailPage: 404
  else Tìm thấy
    ProductsService-->>ProductDetailPage: 200 chi tiết
    alt status = SOLD_OUT (hết bán)
      Note over ProductDetailPage: Hiện mờ, nút Thêm vào giỏ bị vô hiệu
    end
  end
```

Gợi ý khi gõ (BR32) lọc trên client từ chính danh sách món đang hiện đã tải, nên không tốn request và không bao giờ gợi ý món khóa bán. Tìm kiếm và lọc là hai tham số `search` và `categoryId` của cùng route `GET /products` nên chung một hàm `ProductsService.listVisible`.
