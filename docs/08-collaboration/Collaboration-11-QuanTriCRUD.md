# 08 · Collaboration 11 — Quản trị danh mục, topping, khuyến mãi, người dùng, tích điểm, nhân viên (UC48–UC63, UC69, UC75)

Cùng nội dung với `05-sequence/Sequence-11-QuanTriCRUD.md`. Bốn nhóm cùng khuôn `Page → Controller → Service`. Số 1–4 khuyến mãi, 5–8 người dùng, 9–12 danh mục, 13–16 topping, 17–21 tích điểm và thưởng, 22 tạo tài khoản nhân viên. Chỉ `MANAGER`.

## A. Khuyến mãi (UC56–UC59) và người dùng (UC60–UC63)

```mermaid
flowchart LR
  Manager[":Manager"]
  PGP[":AdminPromotionsPage"]
  PRC[":PromotionsController"]
  PRS[":PromotionsService"]
  UGP[":AdminUsersPage"]
  UC[":UsersController"]
  US[":UsersService"]
  LS[":LoyaltyService"]

  Manager -->|"1: load()"| PGP
  PGP -->|"1.1: adminList()"| PRC
  PRC -->|"1.1.1: listAll()"| PRS
  Manager -->|"2: onCreate(form)"| PGP
  PGP -->|"2.1: create(dto)"| PRC
  PRC -->|"2.1.1: create(dto)"| PRS
  Manager -->|"3: onUpdate(promotionId, form)"| PGP
  PGP -->|"3.1: update(id, dto)"| PRC
  PRC -->|"3.1.1: update(promotionId, dto)"| PRS
  Manager -->|"4: onDeactivate(promotionId)"| PGP
  PGP -->|"4.1: deactivate(id)"| PRC
  PRC -->|"4.1.1: deactivate(promotionId)"| PRS

  Manager -->|"5: load(query)"| UGP
  UGP -->|"5.1: adminList(query)"| UC
  UC -->|"5.1.1: list(query)"| US
  Manager -->|"6: onOpen(userId)"| UGP
  UGP -->|"6.1: adminGetOne(id)"| UC
  UC -->|"6.1.1: getDetail(userId)"| US
  Manager -->|"7: onToggleActive(userId, isActive)"| UGP
  UGP -->|"7.1: adminSetActive(id, dto)"| UC
  UC -->|"7.1.1: setActive(userId, isActive)"| US
  Manager -->|"22: onCreateStaff(form)"| UGP
  UGP -->|"22.1: adminCreateStaff(dto)"| UC
  UC -->|"22.1.1: createStaff(dto)"| US
  Manager -->|"8: onViewPoints(userId)"| UGP
  UGP -->|"8.1: adminGetPoints(id)"| UC
  UC -->|"8.1.1: getBalance(userId)"| LS
```

## B. Danh mục (UC48–UC51) và topping (UC52–UC55)

```mermaid
flowchart LR
  Manager[":Manager"]
  CGP[":AdminCategoriesPage"]
  CC[":CategoriesController"]
  CS[":CategoriesService"]
  TGP[":AdminToppingsPage"]
  TC[":ToppingsController"]
  TS[":ToppingsService"]

  Manager -->|"9: load()"| CGP
  CGP -->|"9.1: adminList()"| CC
  CC -->|"9.1.1: listAll()"| CS
  Manager -->|"10: onCreate(form)"| CGP
  CGP -->|"10.1: create(dto)"| CC
  CC -->|"10.1.1: create(dto)"| CS
  Manager -->|"11: onUpdate(categoryId, form)"| CGP
  CGP -->|"11.1: update(id, dto)"| CC
  CC -->|"11.1.1: update(categoryId, dto)"| CS
  Manager -->|"12: onToggleVisibility(categoryId, isVisible)"| CGP
  CGP -->|"12.1: setVisibility(id, dto)"| CC
  CC -->|"12.1.1: setVisibility(categoryId, isVisible)"| CS

  Manager -->|"13: load()"| TGP
  TGP -->|"13.1: adminList()"| TC
  TC -->|"13.1.1: listAll()"| TS
  Manager -->|"14: onCreate(form)"| TGP
  TGP -->|"14.1: create(dto)"| TC
  TC -->|"14.1.1: create(dto)"| TS
  Manager -->|"15: onUpdate(toppingId, form)"| TGP
  TGP -->|"15.1: update(id, dto)"| TC
  TC -->|"15.1.1: update(toppingId, dto)"| TS
  Manager -->|"16: onToggleAvailability(toppingId, isAvailable)"| TGP
  TGP -->|"16.1: setAvailability(id, dto)"| TC
  TC -->|"16.1.1: setAvailability(toppingId, isAvailable)"| TS
```

| Số | UC | Ghi chú |
|---|---|---|
| 1–4 | UC56–UC59 | Tạo: `endsAt` sau `startsAt`, `PERCENT` từ 1 đến 100 kèm mức giảm tối đa bắt buộc, `FIXED` không có mức tối đa (400), mã trùng (409) |
| 5–8 | UC60–UC63 | 7: tự khóa chính mình trả 422. Khóa có hiệu lực lên JWT cũ, xem `Sequence-13-PhanQuyen` |
| 9–12 | UC48–UC51 | Tên danh mục trùng 409. Danh mục ẩn kéo theo sản phẩm ẩn khỏi menu (BR01) |
| 13–16 | UC52–UC55 | Tên topping trùng 409, giá âm 400. Đơn cũ không đổi (BR26) |
| 22 | UC75 | Quản lý tạo tài khoản nhân viên: số điện thoại trùng 409, dữ liệu sai 400. Không cần OTP (BR46) |
| 17–21 | UC69 | Tích điểm và thưởng, vẽ ở mục C bên dưới |

## C. Thiết lập tích điểm và thưởng (UC69)

Số 17 mở trang, 18 lưu tỉ lệ tích điểm, 19 thêm quy tắc thưởng, 20 sửa quy tắc, 21 bật hoặc tắt quy tắc. Chỉ `MANAGER`.

```mermaid
flowchart LR
  Manager[":Manager"]
  LGP[":AdminLoyaltyPage"]
  LC[":LoyaltyController"]
  LS[":LoyaltyService"]

  Manager -->|"17: load()"| LGP
  LGP -->|"17.1: adminGetSettings()"| LC
  LC -->|"17.1.1: getSettings()"| LS
  LGP -->|"17.2: adminListRules()"| LC
  LC -->|"17.2.1: listRules()"| LS
  Manager -->|"18: onSaveSettings(form)"| LGP
  LGP -->|"18.1: adminUpdateSettings(dto)"| LC
  LC -->|"18.1.1: updateSettings(dto)"| LS
  Manager -->|"19: onCreateRule(form)"| LGP
  LGP -->|"19.1: adminCreateRule(dto)"| LC
  LC -->|"19.1.1: createRule(dto)"| LS
  Manager -->|"20: onUpdateRule(ruleId, form)"| LGP
  LGP -->|"20.1: adminUpdateRule(id, dto)"| LC
  LC -->|"20.1.1: updateRule(ruleId, dto)"| LS
  Manager -->|"21: onToggleRule(ruleId, isActive)"| LGP
  LGP -->|"21.1: adminSetRuleActive(id, dto)"| LC
  LC -->|"21.1.1: setRuleActive(ruleId, isActive)"| LS
```

| Số | Ghi chú |
|---|---|
| 17 | Tải tỉ lệ tích điểm hiện tại và danh sách quy tắc thưởng |
| 18 | `amountStep` ≥ 1000 và `pointsPerStep` ≥ 1, sai thì 400. Áp dụng cho các đơn thanh toán từ lúc đổi trở đi (BR11) |
| 19, 20 | Quy tắc: cứ mỗi `threshold` điểm hoặc ly thì cấp một mã riêng; loại mã `PERCENT` phải có mức giảm tối đa, `validDays` từ 1 đến 365 (BR40) |
| 21 | Tắt quy tắc thì ngừng cấp mã mới, mã đã cấp vẫn dùng được |
