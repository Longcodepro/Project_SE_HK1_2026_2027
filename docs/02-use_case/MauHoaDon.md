# 02 · Mẫu hóa đơn (bill)

Bố cục và dữ liệu của hóa đơn, dùng chung cho **xem trong app** (UC25, `OrderDetailPage.openBill`) và **email gửi khi thanh toán thành công** (UC22, `NotificationService.notifyOrderEvent`). Quy tắc: BR28, BR36, BR38. Sơ đồ liên quan: `05-sequence/Sequence-06-TheoDoiDon.md` (xem trong app), `Sequence-14-ThongBao.md` (gửi email).

## 1. Hóa đơn hiển thị ở đâu

| Kênh | Nội dung | Khi nào | Điều kiện |
|---|---|---|---|
| **App** | Hóa đơn đầy đủ | Bất cứ lúc nào xem chi tiết đơn đã thanh toán | Đơn đã thanh toán ít nhất một lần thành công |
| **Email thật** | Hóa đơn đầy đủ, cùng bố cục | Ngay khi thanh toán thành công (`PAYMENT_SUCCESS`) | Khách có điền email (tùy chọn). Không có email thì chỉ xem trong app |
| **SMS giả lập** | Chỉ một dòng: đã thanh toán thành công, **mã đơn** và **mã giao dịch** | Ngay khi thanh toán thành công | Luôn gửi, vì số điện thoại là bắt buộc |

Hóa đơn trong email là **bản chụp tại lúc thanh toán**. Hóa đơn trong app là bản xem lại luôn đúng với đơn hiện tại, nên nếu sau đó đơn bị hủy và hoàn tiền thì app hiện thêm phần hoàn tiền còn email thì không đổi **[GĐ]**.

## 2. Bố cục

Một cột hẹp (rộng tối đa 360 px) giống biên lai, đọc tốt trên điện thoại và trong email. Chữ nhỏ dùng cho tùy chọn, topping và ghi chú để tiết kiệm chỗ.

```text
┌────────────────────────────────────┐
│             BREWLITE               │
│              HÓA ĐƠN               │
├────────────────────────────────────┤
│ Mã đơn         BL2610184821        │
│ Thanh toán     18/10/2026 14:32    │
│ Khách          Nguyễn Văn A        │
│ Điện thoại     09******12          │
│ Hình thức      Thẻ ****1234        │
│ Mã giao dịch   TXN-8F3A21          │
├────────────────────────────────────┤
│ MÓN                    THÀNH TIỀN  │
│                                    │
│ 2 × Trà đào (M · 360 ml)    64.000 │
│   32.000đ/ly · Lạnh · Đá 50% ·     │
│   Đường 50%                        │
│   + Trân châu ×1                   │
│                                    │
│ 1 × Trà đào (M · 360 ml)    44.000 │
│   44.000đ/ly · Lạnh · Đá 50% ·     │
│   Đường 100%                       │
│   + Trân châu ×1, Thạch ×2         │
│   "ít ngọt, không ống hút"         │
│                                    │
│ 1 × Cà phê sữa (L · 500 ml) 35.000 │
│   35.000đ/ly · Nóng · Đường 75%    │
├────────────────────────────────────┤
│ Tạm tính                   143.000 │
│ Giảm giá (mã GIAM10)       -14.300 │
│   Giảm 10%, tối đa 30.000đ         │
│ TỔNG CỘNG                  128.700 │
├────────────────────────────────────┤
│ Điểm tích lũy cộng thêm: +120      │
│ Mã nhận hàng sẽ gửi khi nước xong  │
│                                    │
│     Cảm ơn bạn đã đặt hàng!        │
└────────────────────────────────────┘
```

(Số liệu trong khung chỉ minh họa bố cục, không phải dữ liệu thật.)

## 3. Quy tắc trình bày

| Mục | Quy định |
|---|---|
| **Một dòng cho mỗi loại nước** | Dòng bắt đầu bằng `số ly ×` rồi tên món, kèm size và dung tích (nếu có). Thành tiền căn phải |
| **Cùng món, khác tùy chỉnh** | In thành **dòng riêng** (khác size, đá, đường, nóng/lạnh, topping, hoặc ghi chú). Chỉ gộp thành `n ×` khi giống hệt nhau, đúng như cách giỏ hàng gộp dòng |
| **Dòng chữ nhỏ thứ nhất** | `đơn giá/ly` (đã gồm topping), nhiệt độ, mức đá (bỏ khi chọn nóng), mức đường. Ngăn cách bằng dấu `·` |
| **Dòng chữ nhỏ thứ hai** | Topping, mỗi loại kèm số phần, ví dụ `+ Trân châu ×1, Thạch ×2`. Bỏ dòng này nếu không có topping |
| **Ghi chú** | In **dưới dòng đó**, chữ nhỏ, nghiêng, đặt trong dấu ngoặc kép. **Tối đa 20 từ** (BR36). Bỏ dòng này nếu không có ghi chú |
| **Tiền** | Số nguyên đồng, ngăn cách hàng nghìn bằng dấu chấm, ví dụ `64.000`. Cột thành tiền có đơn vị đồng ở tiêu đề hoặc cuối dòng tổng |
| **Số điện thoại** | Che bốn số giữa, ví dụ `09******12` |
| **Thời gian** | Định dạng `dd/MM/yyyy HH:mm`, giờ Việt Nam, là lúc thanh toán thành công |
| **Hình thức thanh toán** | `EWALLET` hiện "Ví điện tử", `CARD` hiện "Thẻ ****" kèm 4 số cuối (`Payment.cardLast4`), `TRANSFER` hiện "Chuyển khoản" kèm mã tham chiếu (BR41) |
| **Mã giao dịch** | Mã của lần thanh toán **thành công** (`Payment.gatewayRef`). Lần thanh toán thất bại không in |
| **Giảm giá** | Chỉ hiện khi đơn có dùng mã. Dòng chính ghi `Giảm giá (mã XXXX)` và số tiền đã giảm (dấu trừ). Dưới đó là dòng chữ nhỏ mô tả mã: `Giảm 20.000đ` với mã giảm thẳng tiền, `Giảm 10%, tối đa 30.000đ` với mã phần trăm, hoặc `Tặng 1 ly: <tên món được tặng>` (dòng món được tặng cũng ghi chú nhỏ "được tặng") với mã tặng ly. Số tiền giảm in ra là số **thực tế đã giảm** (đã áp mức tối đa). Mã và số tiền lấy từ ảnh chụp lúc đặt, nên dù mã sau này bị vô hiệu hóa hóa đơn vẫn đúng |
| **Thứ tự dòng** | Theo thứ tự khách thêm vào giỏ |

### Hóa đơn xem trong app khi có hoàn tiền

- Cuối hóa đơn có thêm phần **Hoàn tiền** liệt kê từng lần hoàn (lý do, số tiền, hoàn vào ví) và dòng **Thực thu** bằng tổng cộng đã trừ phần hoàn.
- Hoàn tiền món không làm được (UC74) cũng hiện ở phần Hoàn tiền (lý do `MISSING_ITEM`), đơn vẫn giữ trạng thái cũ.
- Đơn bị hủy thì hóa đơn ghi nổi bật **ĐÃ HỦY**, hoàn tiền đủ vào ví.

### Bản email

- Một cột HTML rộng tối đa 360 px, cùng bố cục và thứ tự như trên. Kèm bản chữ thuần cho ứng dụng thư không hiện HTML.
- Tiêu đề thư: `BrewLite · Hóa đơn đơn BLxxxxxxxxxx`.
- Không chứa mật khẩu, mã OTP hay mã nhận hàng.

## 4. Dữ liệu hóa đơn

Hóa đơn **không có bảng riêng**, được dựng từ đơn hàng (`Order`, `OrderItem`, `OrderItemTopping`), lần thanh toán thành công (`Payment`) và các lần hoàn tiền (`Refund`) bằng `BillService.buildBill`. Hình dạng dữ liệu (BillView, BillLine) ở `04-class/Class-04-DTO.md`. Vì dòng đơn đã lưu ảnh chụp tên, giá, dung tích, topping và ghi chú lúc đặt (BR26), hóa đơn luôn đúng với những gì khách đã mua dù sau này quản lý đổi giá.
