# 02 · Use case — Danh mục, quan hệ và phân quyền

Hình: `UseCase-BrewLite.drawio` (1 trang tổng quan) và `UseCase-PhanRa-BrewLite.drawio` (14 trang phân rã PR1–PR14), dựng lại từ file này bằng `09-doi-chieu/md2drawio.mjs`; bản hình gốc của nhóm cất ở `09-doi-chieu/hinh-goc/`. Đặc tả chi tiết từng UC ở `DacTa-UseCase.md`. Mã UC do chúng ta đặt (hình gốc chưa đánh mã): **UC01–UC67 đánh theo thứ tự BFD, UC68 (Quên mật khẩu), UC69 (Thiết lập tích điểm và thưởng), UC70 (Xem các mã giảm giá của tôi), UC71 đến UC77 (ví hoàn tiền, rút tiền, xử lý món không làm được, tạo tài khoản nhân viên, số ly bán trong ngày) bổ sung sau**, và mã UC này dùng nguyên văn ở mọi sơ đồ khác.

## 1. Tác nhân

| Tác nhân | Role trong hệ thống | Quan hệ | Ghi chú |
|---|---|---|---|
| Khách vãng lai | không có JWT | | Xem menu, món, topping, chọn tùy chọn món. **Không** thêm giỏ được |
| Khách hàng | `Role.CUSTOMER` | kế thừa Khách vãng lai (hình PR1 và trang tổng quan) | Thêm giỏ, đặt hàng, thanh toán, theo dõi đơn |
| Nhân viên | `Role.STAFF` | | Xử lý đơn, hủy đơn, đặt hết bán / còn bán, xử lý món không làm được, xem phản hồi dịch vụ |
| Quản lý | `Role.MANAGER` | kế thừa Nhân viên (mũi tên Quản lý → Nhân viên) | Quản trị sản phẩm, danh mục, topping, khuyến mãi, tích điểm, người dùng và tài khoản nhân viên, xử lý rút tiền, thống kê |
| Cổng thanh toán (mock) | hệ thống ngoài giả lập | tác nhân phụ | Chỉ gắn với UC22 (thu tiền). Hoàn tiền không qua cổng mà cộng vào ví của khách (UC38) |
| Cổng SMS (mock) | hệ thống ngoài giả lập | tác nhân phụ | Gửi OTP (UC01) và thông báo; có trên hình use case ở UC01, UC18, UC22, UC34, UC35 (D7) |
| Dịch vụ email | hệ thống ngoài thật (SMTP) | tác nhân phụ | Gửi thông báo cho khách có email; có trên hình use case ở UC01, UC18, UC22, UC34, UC35 (D7) |

## 2. Danh mục use case

| UC | Tên | Tác nhân chính | BFD | Trang phân rã |
|---|---|---|---|---|
| UC01 | Đăng ký tài khoản | Khách vãng lai | 1.1 | PR1 |
| UC02 | Đăng nhập | Khách vãng lai | 1.2 | PR1 |
| UC03 | Đăng xuất | Khách hàng | 1.3 | PR1 |
| UC04 | Xem thông tin cá nhân | Khách hàng | 1.4 | PR1 |
| UC05 | Cập nhật thông tin cá nhân | Khách hàng | 1.4 | PR1 |
| UC06 | Đổi mật khẩu | Khách hàng | 1.5 | PR1 |
| UC07 | Xem danh sách menu | Khách vãng lai | 2.1 | PR2 |
| UC08 | Tìm kiếm sản phẩm theo tên | Khách vãng lai | 2.2 | PR2 |
| UC09 | Lọc sản phẩm theo danh mục | Khách vãng lai | 2.3 | PR2 |
| UC10 | Xem chi tiết sản phẩm | Khách vãng lai | 2.4, 2.8 | PR2 |
| UC11 | Thêm món vào giỏ hàng | Khách hàng | 3.1 | PR3 |
| UC12 | Chọn size | Khách vãng lai | 2.5 | PR3 |
| UC13 | Chọn mức đá và mức đường | Khách vãng lai | 2.6 | PR3 |
| UC14 | Chọn topping thêm | Khách vãng lai | 2.7 | PR3 |
| UC15 | Sửa số lượng sản phẩm | Khách hàng | 3.2 | PR4 |
| UC16 | Sửa tùy chọn của món trong giỏ | Khách hàng | 3.3 | PR4 |
| UC17 | Xóa sản phẩm khỏi giỏ | Khách hàng | 3.4 | PR4 |
| UC18 | Tạo đơn hàng | Khách hàng | 4.1, 4.2 | PR5 |
| UC19 | Áp dụng mã khuyến mãi | Khách hàng | 4.3 | PR5 |
| UC20 | Xác nhận thông tin đơn | Khách hàng | 4.4, 6.1 | PR5 |
| UC21 | Chọn phương thức thanh toán | Khách hàng | 5.1 | PR6 |
| UC22 | Thực hiện giao dịch thanh toán | Khách hàng, Cổng mock | 5.2, 5.3, 7.1 | PR6 |
| UC23 | Thử lại khi thanh toán thất bại | Khách hàng | 5.4 | PR6 |
| UC24 | Xem lịch sử đơn hàng | Khách hàng | 6.2 | PR7 |
| UC25 | Xem chi tiết đơn hàng | Khách hàng | 6.3 | PR7 |
| UC26 | Xem mã nhận hàng | Khách hàng | 6.6 | PR7 |
| UC27 | Hủy đơn hàng (khách) | Khách hàng | 6.4 | PR7 |
| UC28 | Gửi phản hồi dịch vụ (5 sao) | Khách hàng | 6.5 | PR7 |
| UC29 | Xem điểm tích lũy | Khách hàng | 7.2 | PR7 |
| UC30 | Xem danh sách đơn hàng | Nhân viên | 10.1 | PR11 |
| UC31 | Lọc đơn theo trạng thái | Nhân viên | 10.2 | PR11 |
| UC32 | Xem chi tiết đơn hàng (nhân viên) | Nhân viên | 10.3 | PR11 |
| UC33 | Xem thông tin thanh toán của đơn | Nhân viên | 10.6 | PR11 |
| UC34 | Cập nhật trạng thái đơn | Nhân viên | 10.4 | PR11 |
| UC35 | Giao món cho khách | Nhân viên | 10.9, 10.10 | PR11 |
| UC36 | Hủy đơn hàng (nhân viên) | Nhân viên | 10.5 | PR11 |
| UC37 | Xem phản hồi dịch vụ | Nhân viên | 10.7 | PR11 |
| UC38 | Hoàn tiền vào ví (khi hủy đơn đã trả tiền) | Nhân viên | 10.8 | PR11 |
| UC39 | Đặt hết bán / còn bán sản phẩm (hình gọi là "Khóa / mở bán sản phẩm") | Nhân viên | 8.10 | PR8 |
| UC40 | Xem danh sách sản phẩm | Quản lý | 8.1 | PR8 |
| UC41 | Thêm sản phẩm mới | Quản lý | 8.2 | PR8 |
| UC42 | Thiết lập size và giá theo size | Quản lý | 8.6 | PR8 |
| UC43 | Thiết lập topping áp dụng cho sản phẩm | Quản lý | 8.7 | PR8 |
| UC44 | Thiết lập mức đá min / max và mặc định | Quản lý | 8.8 | PR8 |
| UC45 | Thiết lập mức đường min / max và mặc định | Quản lý | 8.9 | PR8 |
| UC46 | Cập nhật thông tin sản phẩm | Quản lý | 8.3 | PR8 |
| UC47 | Khóa bán / mở lại sản phẩm (hình gọi là "Ẩn / hiện sản phẩm") | Quản lý | 8.4 | PR8 |
| UC48 | Xem danh sách danh mục | Quản lý | 8.5 | PR9 |
| UC49 | Thêm danh mục | Quản lý | 8.5 | PR9 |
| UC50 | Cập nhật danh mục | Quản lý | 8.5 | PR9 |
| UC51 | Ẩn / hiện danh mục | Quản lý | 8.5 | PR9 |
| UC52 | Xem danh sách topping | Quản lý | 9.1 | PR10 |
| UC53 | Thêm topping mới | Quản lý | 9.2 | PR10 |
| UC54 | Cập nhật tên và giá topping | Quản lý | 9.3 | PR10 |
| UC55 | Khóa / mở bán topping | Quản lý | 9.4 | PR10 |
| UC56 | Xem danh sách mã khuyến mãi | Quản lý | 11.1 | PR12 |
| UC57 | Tạo mã khuyến mãi | Quản lý | 11.2 | PR12 |
| UC58 | Cập nhật mã khuyến mãi | Quản lý | 11.3 | PR12 |
| UC59 | Vô hiệu hóa mã khuyến mãi | Quản lý | 11.4 | PR12 |
| UC60 | Xem danh sách tài khoản khách hàng | Quản lý | 12.1 | PR13 |
| UC61 | Xem chi tiết tài khoản | Quản lý | 12.2 | PR13 |
| UC62 | Khóa / mở khóa tài khoản | Quản lý | 12.3 | PR13 |
| UC63 | Xem điểm tích lũy của khách | Quản lý | 12.4 | PR13 |
| UC64 | Thống kê doanh thu theo thời gian | Quản lý | 13.1 | PR14 |
| UC65 | Thống kê sản phẩm bán chạy | Quản lý | 13.2 | PR14 |
| UC66 | Thống kê topping được chọn nhiều | Quản lý | 13.3 | PR14 |
| UC67 | Thống kê số đơn theo trạng thái | Quản lý | 13.4 | PR14 |
| UC68 | Quên mật khẩu (bổ sung ngoài BFD gốc) | Khách vãng lai | 1.6 | PR1 |
| UC69 | Thiết lập tích điểm và thưởng (bổ sung ngoài BFD gốc) | Quản lý | 11.5 | PR12 |
| UC70 | Xem các mã giảm giá của tôi (bổ sung ngoài BFD gốc) | Khách hàng | 7.3 | PR7 |
| UC71 | Xem ví hoàn tiền (bổ sung ngoài BFD gốc) | Khách hàng | 6.7 | PR7 |
| UC72 | Yêu cầu rút tiền từ ví (bổ sung ngoài BFD gốc) | Khách hàng | 6.8 | PR7 |
| UC73 | Xử lý yêu cầu rút tiền (bổ sung ngoài BFD gốc) | Quản lý | 10.11 | PR11 |
| UC74 | Xử lý món không làm được (bổ sung ngoài BFD gốc) | Nhân viên | 10.12 | PR11 |
| UC75 | Tạo tài khoản nhân viên (bổ sung ngoài BFD gốc) | Quản lý | 12.5 | PR13 |
| UC76 | Thiết lập số ly bán trong ngày (bổ sung ngoài BFD gốc) | Quản lý | 8.11 | PR8 |
| UC77 | Dùng lại số ly của hôm qua (bổ sung ngoài BFD gốc) | Quản lý | 8.12 | PR8 |

## 3. Quan hệ giữa các use case (đúng như hình)

| Loại | Từ | Đến | Nguồn hình |
|---|---|---|---|
| include | UC11 Thêm món vào giỏ | UC12, UC13, UC14 | PR3, tổng quan |
| include | UC22 Thực hiện giao dịch thanh toán | UC21 Chọn phương thức | tổng quan (Thanh toán include Chọn phương thức) |
| include | UC32 Xem chi tiết đơn (nhân viên) | UC33 Xem thông tin thanh toán | PR11 |
| include | UC27 Hủy đơn (khách), UC36 Hủy đơn (nhân viên) | UC38 Hoàn tiền (khi đơn đã trả tiền) | tài liệu; hình gốc vẽ UC37 include UC38, xem D1 |
| include | UC41 Thêm sản phẩm mới | UC42, UC43, UC44, UC45 | PR8, trang quản trị danh mục |
| extend | UC08 Tìm kiếm | UC07 Xem danh sách menu | PR2 |
| extend | UC09 Lọc theo danh mục | UC07 Xem danh sách menu | PR2 |
| extend | UC19 Áp dụng mã khuyến mãi | UC18 Tạo đơn hàng | PR5 |
| extend | UC23 Thử lại khi thanh toán thất bại | UC22 Thực hiện giao dịch thanh toán | PR6 |
| extend | UC31 Lọc đơn theo trạng thái | UC30 Xem danh sách đơn hàng | PR11 |
| tác nhân phụ | Cổng thanh toán (mock) | UC22 | PR6 (hình gốc còn nối cả UC38, xem D13) |

## 4. Phân quyền

| Nhóm UC | Ai được gọi | Ghi chú |
|---|---|---|
| UC01, UC02, UC68, UC07–UC10, UC12–UC14 | Khách vãng lai trở lên | Xem menu, món, topping và chọn tùy chọn. UC12–UC14 chưa thêm giỏ được (BR29) |
| UC03–UC06, UC11, UC15–UC29, UC70–UC72 | Khách hàng (`CUSTOMER`) | UC11, UC15–UC17 chạy ở client (giỏ hàng) nhưng cần đăng nhập. Chỉ thấy đơn của mình |
| UC30–UC39, UC74 (và xem danh sách UC40) | `STAFF` và `MANAGER` | Quản lý kế thừa Nhân viên. Riêng xem danh sách các lần xử lý món không làm được (`GET /admin/item-issues`, thuộc UC74) chỉ `MANAGER` |
| UC40–UC67, UC69, UC73, UC75–UC77 | chỉ `MANAGER` | |

## 5. Chức năng BFD không vẽ thành use case

Hệ thống tự làm trong use case khác (xem cột "Loại" ở `01-bfd/BFD-BrewLite.md`): 2.8 và UC10, 3.5 và UC11/15/16/17, 4.1 và UC18, 5.3 và 7.1 và UC22, 10.9 và UC35.

**Các việc hệ thống mới, không có trong BFD, không vẽ thành use case riêng:** (1) xác thực OTP khi đăng ký, nằm trong UC01 (BR27); (2) gửi thông báo SMS mock và email, chạy kèm UC18, UC22, UC34, UC35 (BR28); (3) cộng điểm, cộng số ly và tự cấp mã thưởng sau thanh toán thành công, nằm trong UC22 (BR11, BR40); (4) cộng tiền hoàn vào ví khi hủy đơn, nằm trong UC38 (BR43); (5) dựng và gửi hóa đơn, nằm trong UC22 và UC25 (BR38); (6) trừ số ly còn lại của món khi tạo đơn và trả lại khi hủy đơn, nằm trong UC18 và UC27, UC36 (BR49, BR50); (7) thu hồi điểm và số ly khi hủy đơn đã trả tiền, nằm trong UC27 và UC36 (BR51).
