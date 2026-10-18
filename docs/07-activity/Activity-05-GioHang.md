# 07 · Activity 05 — Tùy chỉnh món và giỏ hàng (UC11–UC17, BFD nhóm 3)

Chọn tùy chọn món (UC12–UC14) làm được khi chưa đăng nhập. **Thêm vào giỏ (UC11) và sửa giỏ (UC15–UC17) cần đăng nhập** (BR29). Mọi bước chạy ở client, không gọi server (BR06). Chi tiết ở `05-sequence/Sequence-03-GioHang.md`.

```mermaid
flowchart TD
  S((Bắt đầu: ở trang chi tiết)) --> A0{"Món còn bán? status = ON_SALE"}
  A0 -- "Không" --> X["Nút thêm giỏ bị vô hiệu"] --> Z((Kết thúc))
  A0 -- "Có" --> B1["UC12 Chọn size: ProductDetailPage.selectSize"]
  B1 --> B2["ProductDetailPage.calcUnitPrice"]
  B2 --> C1["UC13 Chọn đá và đường: ProductDetailPage.selectLevels"]
  C1 --> C2{"Trong min và max của sản phẩm?"}
  C2 -- "Không" --> C1
  C2 -- "Có" --> T1{"Món cho chọn cả nóng và lạnh?"}
  T1 -- "Có" --> T2["ProductDetailPage.selectTemperature, chọn nóng thì đá về 0 và khóa"] --> D1{"Thêm topping?"}
  T1 -- "Không: ô nóng lạnh bị khóa ở nhiệt độ duy nhất của món" --> D1
  D1 -- "Có UC14" --> D2["ProductDetailPage.setToppingQuantity: chọn số phần, khóa khi đủ giới hạn"] --> D3["ProductDetailPage.calcUnitPrice"] --> D1
  D1 -- "Không" --> N1["Ghi chú tùy chọn: ProductDetailPage.setNote"] --> E1["UC11 ProductDetailPage.onAddToCart"]
  E1 --> E1a{"Đã đăng nhập? AuthStore.isLoggedIn"}
  E1a -- "Chưa" --> E1b["CartStore.savePending, sang LoginPage hoặc RegisterPage"]
  E1b --> E1c["Đăng nhập hoặc đăng ký xong: CartStore.loadForUser, CartStore.applyPending"]
  E1c --> E2
  E1a -- "Rồi" --> E2{"Đã có dòng cùng sản phẩm và tùy chọn?"}
  E2 -- "Có" --> E3["CartStore.addItem cộng dồn số lượng"]
  E2 -- "Không" --> E4["CartStore.addItem tạo dòng mới"]
  E3 --> F1
  E4 --> F1["CartStore.getTotal, CartStore.getCount cập nhật badge"]
  F1 --> G0{"Mở giỏ để sửa?"}
  G0 -- "Không" --> Z
  G0 -- "Có" --> G1["CartPage.load, CartStore.getItems"]
  G1 --> H0{"Thao tác?"}
  H0 -- "Đổi số lượng UC15" --> H1{"Số lượng từ 1 trở lên?"}
  H1 -- "Không" --> H0
  H1 -- "Có" --> H2["CartPage.onChangeQuantity, CartStore.updateQuantity"] --> J1
  H0 -- "Đổi tùy chọn UC16" --> I1["CartPage.onEditOptions, CartStore.updateOptions"]
  I1 --> I2{"Trùng dòng khác?"}
  I2 -- "Có" --> I3["Gộp dòng"] --> J1
  I2 -- "Không" --> J1
  H0 -- "Xóa UC17" --> K1["CartPage.onRemove, CartStore.removeItem"] --> J1
  J1["CartStore.getTotal tính lại tổng tiền"] --> H0
  H0 -- "Xong" --> Z
```
