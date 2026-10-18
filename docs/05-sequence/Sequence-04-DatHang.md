# 05 · Sequence 04 — Đặt hàng (UC18–UC20)

Phủ: UC20 Xác nhận thông tin đơn, UC19 Áp dụng mã khuyến mãi (extend UC18), UC18 Tạo đơn hàng (gồm kiểm tùy chọn, BFD 4.1). Quy tắc: BR02, BR03, BR04, BR05, BR07, BR08, BR09, BR20, BR25, BR26, BR35, BR36, BR37, BR39. Luồng tiếp theo là `Sequence-05-ThanhToan`. Collaboration tương ứng: `08-collaboration/Collaboration-01-DatHang.md` (cùng thứ tự gọi hàm).

```mermaid
sequenceDiagram
  autonumber
  actor Customer as Khách hàng
  participant CheckoutPage
  participant CartStore
  participant AuthStore
  participant PromotionsController
  participant PromotionsService
  participant OrdersController
  participant OrdersService
  participant ProductsService
  participant NotificationService
  participant DB

  Note over Customer,DB: UC20 Xác nhận thông tin đơn
  Customer->>CheckoutPage: open()
  CheckoutPage->>AuthStore: isLoggedIn()
  CheckoutPage->>CartStore: getItems()
  CheckoutPage->>CartStore: getTotal()
  alt Chưa đăng nhập
    Note over CheckoutPage: Chuyển sang LoginPage
  else Giỏ rỗng
    Note over CheckoutPage: Quay lại CartPage
  else Hợp lệ
    Note over CheckoutPage: Hiện tóm tắt các dòng, tùy chọn và tổng tiền
  end

  opt UC70 Khách xem các mã giảm giá của mình để chọn
    Customer->>CheckoutPage: loadMyVouchers()
    CheckoutPage->>PromotionsController: GET /promotions/mine
    PromotionsController->>PromotionsService: listMine(userId)
    PromotionsService->>DB: đọc mã riêng của khách còn dùng được và mã chung còn lượt
    PromotionsService-->>CheckoutPage: 200 danh sách mã kèm mô tả và hạn dùng
  end

  opt UC19 Áp dụng mã khuyến mãi
    opt Mã tặng ly (FREE_DRINK)
      Customer->>CheckoutPage: onPickFreeCup(lineId)
      Note over CheckoutPage: Chỉ cho chọn ly có món thuộc danh sách món được tặng của mã
    end
    Customer->>CheckoutPage: onApplyPromo(code)
    CheckoutPage->>PromotionsController: GET /promotions/validate
    PromotionsController->>PromotionsService: validateCode(userId, code, subtotal, cups, pickedCup)
    PromotionsService->>DB: đọc Promotion theo code
    alt Không tồn tại, hết hạn, bị vô hiệu, chưa đủ minOrderAmount, mã riêng của người khác, hoặc hết lượt dùng
      PromotionsService-->>CheckoutPage: 422 Mã không hợp lệ
      Note over CheckoutPage: Hiện lỗi, khách vẫn đặt tiếp không giảm giá
    else Hợp lệ
      PromotionsService->>PromotionsService: calcDiscount(promotion, subtotal, cups, pickedCup)
      PromotionsService-->>CheckoutPage: 200 discountAmount
    end
  end

  Note over Customer,DB: UC18 Tạo đơn hàng
  Customer->>CheckoutPage: onConfirm()
  CheckoutPage->>OrdersController: POST /orders
  OrdersController->>OrdersService: createOrder(userId, dto)
  OrdersService->>ProductsService: findForOrder(productIds)
  ProductsService->>DB: đọc sản phẩm kèm size, topping, mức đá và đường
  alt Có sản phẩm không tồn tại, đang khóa bán (LOCKED) hoặc thuộc danh mục ẩn
    OrdersService-->>CheckoutPage: 404
  end
  loop Mỗi dòng trong giỏ
    OrdersService->>ProductsService: validateSelection(product, line)
    alt Hết bán (SOLD_OUT), size hoặc topping sai, đá hoặc đường ngoài min max, nhiệt độ không được phép, chọn nóng mà đá khác 0, hoặc vượt giới hạn số phần topping
      ProductsService-->>CheckoutPage: 422 giữ nguyên giỏ
    else Hợp lệ
      ProductsService-->>OrdersService: unitPrice
    end
  end
  opt Đơn có promotionCode
    OrdersService->>PromotionsService: validateCode(userId, code, subtotal, cups, pickedCup)
    Note over OrdersService: Mã tặng ly: pickedCup là freeCupLine khách gửi lên, phải là dòng có món thuộc danh sách của mã
    alt Mã không hợp lệ
      PromotionsService-->>CheckoutPage: 422
    end
  end
  OrdersService->>OrdersService: generateOrderCode()
  OrdersService->>ProductsService: reserveStock(lines)
  alt Không đủ số ly còn lại của một món, kể cả khi đặt đồng thời
    ProductsService-->>CheckoutPage: 422 nêu tên món, không tạo đơn, giữ giỏ
  else Đủ
    ProductsService->>DB: trừ stockRemaining bằng cập nhật có điều kiện theo stockVersion, cùng giao dịch với bước lưu đơn (BR50)
  end
  OrdersService->>DB: lưu Order PENDING (kèm mã khuyến mãi và số tiền giảm), OrderItem (kèm nhiệt độ và ghi chú), OrderItemTopping (ảnh chụp tên, giá và số phần)
  opt Đơn có dùng mã khuyến mãi
    OrdersService->>PromotionsService: recordUsage(promotionId, userId, orderId)
    PromotionsService->>DB: lưu lượt dùng mã (giữ chỗ ngay khi tạo đơn)
  end
  OrdersService->>NotificationService: notifyOrderEvent(orderId, event)
  Note over NotificationService: event = ORDER_CREATED, gửi SMS mock và email nếu có, chi tiết ở Sequence-14
  OrdersService-->>CheckoutPage: 201 order kèm orderCode
  CheckoutPage->>CartStore: clear()
  Note over CheckoutPage: Hiện orderCode rồi chuyển sang PaymentPage
```

Giá khách thấy ở giỏ chỉ để hiển thị. `OrdersService.createOrder` luôn tự tính lại từ DB (BR06), và đọc DB mỗi lần nên đổi trạng thái món (hết bán, khóa bán) có hiệu lực ngay (BR20).
