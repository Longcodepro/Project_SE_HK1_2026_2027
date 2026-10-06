# Backlog — BrewLite

Cập nhật trạng thái sau mỗi task xong. Không được tự chuyển task của người kia.

## Sprint Overview

| Sprint | Thời điểm | Mục tiêu |
|---|---|---|
| Sprint 1 | Tối 2026-10-05 | Menu xem được — task 1, 2, 3 |
| Sprint 2 | Sáng 2026-10-06 | Chọn món, giỏ hàng, đặt đơn — task 4, 5, 6, 7 |
| Sprint 3 | Chiều 2026-10-06 | Thanh toán và bàn giao — task 8, 9, 10 |

---

## Task List

| # | Tên task | Tiêu chí chấp nhận | Người làm | Sprint | Trạng thái |
|---|---|---|---|---|---|
| 1 | Khởi tạo dự án và cấu trúc | Repo có đủ cấu trúc, README hướng dẫn chạy, cả hai app chạy được | Cả hai | Sprint 1 | **Done** |
| 2 | API danh sách sản phẩm (GET /products) | Trả mảng 4 sản phẩm, có id/name/price/stock, status 200 | Long | Sprint 1 | **Done** |
| 3 | Trang Menu (Next.js) | Hiển thị danh sách sản phẩm, có loading skeleton, có empty state khi rỗng | Tài | Sprint 1 | **Done** |
| 4 | Chi tiết sản phẩm — chọn size và topping | Chọn S/M/L, chọn topping, giá tự tính theo size, nút "Thêm vào giỏ" | Tài | Sprint 2 | **Done** |
| 5 | Giỏ hàng: thêm/sửa/xóa, tổng tiền, badge | Thêm/sửa số lượng/xóa món, tổng tiền cập nhật, badge hiện số lượng item | Tài | Sprint 2 | **Done** |
| 6 | POST /orders: nhận giỏ, validate, lưu PENDING | Nhận items, validate, trừ tồn kho, lưu DB status PENDING, trả mã đơn | Long | Sprint 2 | **Done** |
| 7 | Đăng ký/đăng nhập JWT, bcrypt, guard route | Register/Login trả JWT, bcrypt hash, route POST /orders chặn nếu chưa login | Long | Sprint 2 | **Done** |
| 8 | Thanh toán mock: chọn Ví/Thẻ, POST /payments | Chọn phương thức, gọi API, hiện kết quả PAID hoặc PAYMENT_FAILED, nút thử lại | Long | Sprint 3 | **Done** |
| 9 | Màn xác nhận + GET /orders/me + docker-compose | Màn sau đặt đơn, lịch sử đơn, docker compose up chạy toàn bộ, demo end-to-end | Cả hai | Sprint 3 | To do |
| 10 | Order State Machine + idempotent payment + loyalty | Chặn chuyển trạng thái sai, Idempotency-Key, optimistic lock tồn kho, cộng điểm loyalty | Long | Sprint 3 (nếu còn giờ) | To do |

---

## Ghi chú

- Task 10 là nghiệp vụ backend nâng cao, làm sau khi task 8, 9 xong.
- Mỗi khi bắt đầu task, đổi trạng thái thành **Doing**.
- Mỗi khi xong task (đủ Definition of Done trong CLAUDE.md), đổi thành **Done**.
- Nếu bị block, ghi chú vào đây để người kia biết.
