# 05 · Sequence 03 — Giỏ hàng (UC11–UC17)

Phủ: UC12 Chọn size, UC13 Chọn đá và đường (kèm nóng/lạnh và ghi chú), UC14 Chọn topping (khách vãng lai làm được), UC11 Thêm món vào giỏ (**cần đăng nhập**, include UC12–UC14), UC15 Sửa số lượng, UC16 Sửa tùy chọn, UC17 Xóa (cần đăng nhập vì giỏ chỉ có sau khi đăng nhập). Giỏ chỉ ở client (BR06) nên **không có request nào tới server**; tổng tiền là BFD 3.5. Khách chưa đăng nhập bấm thêm vào giỏ thì món được nhớ tạm, đăng nhập hoặc đăng ký xong sẽ tự thêm (Sequence-01).

## A. Chọn tùy chọn món (UC12, UC13, UC14), không cần đăng nhập

```mermaid
sequenceDiagram
  autonumber
  actor Guest as Khách (chưa hoặc đã đăng nhập)
  participant ProductDetailPage

  Note over ProductDetailPage: Dữ liệu sản phẩm đã tải ở Sequence-02
  Guest->>ProductDetailPage: selectSize(sizeCode)
  ProductDetailPage->>ProductDetailPage: calcUnitPrice()
  Guest->>ProductDetailPage: selectLevels(iceLevel, sugarLevel)
  Note over ProductDetailPage: Mức ngoài min và max của sản phẩm thì không cho chọn (BR04)
  opt Món cho cả nóng và lạnh
    Guest->>ProductDetailPage: selectTemperature(temperature)
    Note over ProductDetailPage: Chọn HOT thì iceLevel về 0 và ô đá bị khóa (BR35). Món chỉ có một nhiệt độ thì ô nóng lạnh bị khóa sẵn, không gọi bước này
  end
  loop Mỗi lần khách đổi số phần của một topping
    Guest->>ProductDetailPage: setToppingQuantity(toppingId, quantity)
    Note over ProductDetailPage: Nút tăng bị khóa khi topping đó đủ maxPerTopping hoặc tổng đủ maxToppingTotal của món (BR37). 0 phần là bỏ topping
    ProductDetailPage->>ProductDetailPage: calcUnitPrice()
  end
  opt Khách muốn ghi chú
    Guest->>ProductDetailPage: setNote(note)
    Note over ProductDetailPage: Tối đa 20 từ, tùy chọn (BR36)
  end
```

## B. Thêm vào giỏ (UC11), cần đăng nhập

```mermaid
sequenceDiagram
  autonumber
  actor Guest as Khách (chưa hoặc đã đăng nhập)
  participant ProductDetailPage
  participant AuthStore
  participant CartStore

  Guest->>ProductDetailPage: onAddToCart()
  alt status = SOLD_OUT (hết bán)
    Note over ProductDetailPage: Nút bị vô hiệu, không gọi được (BR02)
  else Đang mở bán
    ProductDetailPage->>AuthStore: isLoggedIn()
    alt Chưa đăng nhập
      ProductDetailPage->>CartStore: savePending(line)
      Note over ProductDetailPage: Chuyển sang LoginPage hoặc RegisterPage. Sau khi đăng nhập xong, LoginPage gọi CartStore.loadForUser rồi CartStore.applyPending, xem Sequence-01
    else Đã đăng nhập
      ProductDetailPage->>CartStore: addItem(line)
      Note over CartStore: Cùng sản phẩm, size, đá, đường, nhiệt độ, ghi chú, topping thì cộng dồn số lượng
      ProductDetailPage->>CartStore: getTotal()
      ProductDetailPage->>CartStore: getCount()
      CartStore-->>ProductDetailPage: tổng tiền và badge số lượng mới
    end
  end
```

## C. Sửa giỏ hàng (UC15, UC16, UC17), Khách hàng

```mermaid
sequenceDiagram
  autonumber
  actor Customer as Khách hàng
  participant CartPage
  participant CartStore

  Customer->>CartPage: load()
  CartPage->>CartStore: getItems()
  CartPage->>CartStore: getTotal()

  opt UC15 Sửa số lượng
    Customer->>CartPage: onChangeQuantity(lineId, quantity)
    alt quantity nhỏ hơn 1
      Note over CartPage: Không hợp lệ, dùng nút xóa (UC17)
    else Hợp lệ
      CartPage->>CartStore: updateQuantity(lineId, quantity)
    end
  end

  opt UC16 Sửa tùy chọn của món
    Customer->>CartPage: onEditOptions(lineId, options)
    CartPage->>CartStore: updateOptions(lineId, options)
    Note over CartStore: Kiểm lựa chọn mới theo ảnh chụp tùy chọn của món đã lưu trong dòng (không gọi máy chủ), tính lại unitPrice. Trùng dòng khác thì gộp dòng
  end

  opt UC17 Xóa sản phẩm khỏi giỏ
    Customer->>CartPage: onRemove(lineId)
    CartPage->>CartStore: removeItem(lineId)
  end

  CartPage->>CartStore: getTotal()
  CartStore-->>CartPage: tổng tiền mới
```
