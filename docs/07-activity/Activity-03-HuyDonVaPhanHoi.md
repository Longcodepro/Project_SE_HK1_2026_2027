# 07 · Activity 03 — Hủy đơn, hoàn tiền và phản hồi dịch vụ

Ba luồng: hủy đơn có hoàn tiền vào ví (UC27, UC36 → UC38), phản hồi dịch vụ sau khi nhận hàng (UC28 → UC37), và xử lý món không làm được (UC74). Chi tiết gọi hàm ở `05-sequence/Sequence-07-HuyDon.md` và `Sequence-08-PhanHoiDichVu.md`.

## A. Phản hồi dịch vụ

```mermaid
flowchart TD
  S((Bắt đầu: đơn COMPLETED, khách đã nhận hàng)) --> A0{"Khách muốn phản hồi?"}
  A0 -- "Không" --> Z((Kết thúc))
  A0 -- "Có" --> A1["UC28 OrderDetailPage.onSubmitFeedback: chọn 1 đến 5 sao, ghi nhận xét tùy chọn"]
  A1 --> A2{"Hợp lệ? Đơn COMPLETED, chưa có phản hồi, sao từ 1 đến 5"}
  A2 -- "Không: 400 hoặc 409" --> A0
  A2 -- "Có" --> A3["FeedbackService.submit lưu phản hồi"]
  A3 --> B1["UC37 Nhân viên xem: AdminFeedbackPage.load, FeedbackService.listAll"]
  B1 --> Z
```

## B. Hủy đơn

```mermaid
flowchart TD
  S((Bắt đầu)) --> A0{"Ai hủy?"}
  A0 -- "Khách UC27" --> A1["OrderDetailPage.onCancel, OrdersService.cancelByCustomer"]
  A0 -- "Nhân viên UC36" --> A2["AdminOrdersPage.onCancel: nhập lý do bắt buộc, OrdersService.cancelByStaff"]
  A1 --> B1["OrdersService.cancelOrder"]
  A2 --> B1
  B1 --> B2{"Trạng thái đơn?"}
  B2 -- "PREPARING, READY, COMPLETED, CANCELLED" --> X["409 Không hủy được"] --> Z((Kết thúc))
  B2 -- "PENDING, PAYMENT_FAILED" --> C1["Chưa trả tiền: không hoàn tiền"] --> E2
  B2 -- "PAID" --> E1["UC38 RefundsService.refund, reason CANCEL, hoàn totalAmount"]
  E1 --> E1a["WalletService.credit: cộng tiền vào ví của khách"] --> E2["Order CANCELLED, ghi cancelReason, người hủy và lý do"]
  E2 --> E3["Đơn có dùng mã khuyến mãi: PromotionsService.releaseUsage trả lại lượt dùng mã"] --> E4["ProductsService.releaseStock trả lại số ly của các món"]
  E4 --> E5{"Đơn đã trả tiền?"}
  E5 -- "Có" --> E6["LoyaltyService.revoke thu hồi điểm và số ly"] --> Z
  E5 -- "Không" --> Z
```

## C. Xử lý món không làm được

```mermaid
flowchart TD
  S((Bắt đầu: một món trong đơn hết làm được, đơn chưa giao)) --> A1["UC74 AdminOrdersPage.onHandleMissingItem: chọn dòng, số ly thiếu, cách xử lý, nhập lý do"]
  A1 --> A2{"Đơn ở PAID, PREPARING hoặc READY? Số ly hợp lệ? Có lý do?"}
  A2 -- "Không: 409, 422 hoặc 400" --> Z((Kết thúc))
  A2 -- "Có" --> A3{"Cách xử lý?"}
  A3 -- "Hoàn tiền vào ví" --> B1["OrdersService.handleMissingItem gọi RefundsService.refund, reason MISSING_ITEM"]
  B1 --> B2["WalletService.credit: cộng đơn giá ly × số ly vào ví"] --> C1
  A3 -- "Đổi món khác" --> B3["Đổi món ngoài quầy, chỉ ghi nhận"] --> C1
  C1["Lưu ItemIssue: nhân viên, lý do, cách xử lý"] --> D1["Quản lý xem lại: AdminOrdersPage.loadItemIssues, OrdersService.listItemIssues"] --> Z
```
