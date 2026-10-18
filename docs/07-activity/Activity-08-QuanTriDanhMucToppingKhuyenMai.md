# 07 · Activity 08 — Quản trị danh mục, topping, khuyến mãi (UC48–UC59, BFD nhóm 8.5, 9, 11)

Ba nhóm cùng một khuôn nên vẽ chung: chọn nhóm, rồi xem / thêm / sửa / bật tắt. Điểm riêng nằm ở bước kiểm tra. Chi tiết gọi hàm ở `05-sequence/Sequence-11-QuanTriCRUD.md`. Chỉ `MANAGER`.

```mermaid
flowchart TD
  S((Bắt đầu: Quản lý)) --> A0{"Quản trị mục nào?"}
  A0 -- "Danh mục" --> B1["UC48 AdminCategoriesPage.load, CategoriesService.listAll"]
  A0 -- "Topping" --> C1["UC52 AdminToppingsPage.load, ToppingsService.listAll"]
  A0 -- "Khuyến mãi" --> D1["UC56 AdminPromotionsPage.load, PromotionsService.listAll"]

  B1 --> B0{"Thao tác?"}
  B0 -- "Thêm UC49" --> B2["AdminCategoriesPage.onCreate, CategoriesService.create"]
  B2 --> B3{"Tên trùng?"}
  B3 -- "Có: 409" --> B2
  B3 -- "Không" --> B1
  B0 -- "Sửa UC50" --> B4["AdminCategoriesPage.onUpdate, CategoriesService.update"] --> B1
  B0 -- "Ẩn hoặc hiện UC51" --> B5["AdminCategoriesPage.onToggleVisibility, CategoriesService.setVisibility"]
  B5 --> B6["Danh mục ẩn kéo theo sản phẩm của nó ẩn khỏi menu"] --> B1
  B0 -- "Xong" --> Z((Kết thúc))

  C1 --> C0{"Thao tác?"}
  C0 -- "Thêm UC53" --> C2["AdminToppingsPage.onCreate, ToppingsService.create"]
  C2 --> C3{"Tên trùng hoặc giá âm?"}
  C3 -- "Có: 409 hoặc 400" --> C2
  C3 -- "Không" --> C1
  C0 -- "Sửa tên và giá UC54" --> C4["AdminToppingsPage.onUpdate, ToppingsService.update"]
  C4 --> C5["Đơn cũ không đổi vì lưu ảnh chụp giá"] --> C1
  C0 -- "Khóa hoặc mở bán UC55" --> C6["AdminToppingsPage.onToggleAvailability, ToppingsService.setAvailability"] --> C1
  C0 -- "Xong" --> Z

  D1 --> D0{"Thao tác?"}
  D0 -- "Tạo UC57" --> D2["AdminPromotionsPage.onCreate, PromotionsService.create"]
  D2 --> D3{"Hợp lệ? endsAt sau startsAt, PERCENT từ 1 đến 100 kèm mức giảm tối đa, FIXED không có mức tối đa"}
  D3 -- "Sai: 400" --> D2
  D3 -- "Mã trùng: 409" --> D2
  D3 -- "Có" --> D1
  D0 -- "Sửa UC58" --> D4["AdminPromotionsPage.onUpdate, PromotionsService.update"] --> D1
  D0 -- "Vô hiệu hóa UC59" --> D5["AdminPromotionsPage.onDeactivate, PromotionsService.deactivate"]
  D5 --> D6["isActive = false, đơn cũ không đổi"] --> D1
  D0 -- "Xong" --> Z

  A0 -- "Tích điểm và thưởng UC69" --> L1["AdminLoyaltyPage.load, LoyaltyService.getSettings, LoyaltyService.listRules"]
  L1 --> L0{"Thao tác?"}
  L0 -- "Đổi tỉ lệ tích điểm" --> L2["AdminLoyaltyPage.onSaveSettings, LoyaltyService.updateSettings"]
  L2 --> L3{"amountStep từ 1000 và pointsPerStep từ 1?"}
  L3 -- "Không: 400" --> L2
  L3 -- "Có" --> L1
  L0 -- "Thêm hoặc sửa quy tắc thưởng" --> L4["AdminLoyaltyPage.onCreateRule hoặc onUpdateRule, LoyaltyService.createRule hoặc updateRule"]
  L4 --> L5{"Hợp lệ? PERCENT có mức tối đa, validDays từ 1 đến 365"}
  L5 -- "Không: 400" --> L4
  L5 -- "Có" --> L1
  L0 -- "Bật hoặc tắt quy tắc" --> L6["AdminLoyaltyPage.onToggleRule, LoyaltyService.setRuleActive"] --> L1
  L0 -- "Xong" --> Z
```
