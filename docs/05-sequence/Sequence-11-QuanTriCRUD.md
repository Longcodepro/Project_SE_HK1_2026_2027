# 05 · Sequence 11 — Quản trị dạng CRUD, tích điểm và tài khoản nhân viên (UC48–UC63, UC69, UC75)

Phủ: danh mục (UC48–UC51), topping (UC52–UC55), khuyến mãi (UC56–UC59), người dùng (UC60–UC63), tích điểm và thưởng (UC69), tạo tài khoản nhân viên (UC75). Các nhóm này **cùng một khuôn**, nên vẽ một sơ đồ mẫu bằng khuyến mãi (nhóm có thêm kiểm tra nghiệp vụ), sau đó liệt kê từng UC ở bảng ánh xạ. Riêng khóa tài khoản (UC62) có ảnh hưởng tới JWT nên vẽ riêng ở mục B. Quy tắc: BR17, BR18. Mọi route yêu cầu `MANAGER`.

## A. Khuôn mẫu (ví dụ khuyến mãi, UC56–UC59)

```mermaid
sequenceDiagram
  autonumber
  actor Manager as Quản lý
  participant AdminPromotionsPage
  participant PromotionsController
  participant PromotionsService
  participant DB

  Manager->>AdminPromotionsPage: load()
  AdminPromotionsPage->>PromotionsController: GET /admin/promotions
  PromotionsController->>PromotionsService: listAll()
  PromotionsService->>DB: đọc mọi mã
  PromotionsService-->>AdminPromotionsPage: 200 danh sách

  opt UC57 Tạo mã khuyến mãi
    Manager->>AdminPromotionsPage: onCreate(form)
    AdminPromotionsPage->>PromotionsController: POST /admin/promotions
    PromotionsController->>PromotionsService: create(dto)
    alt Dữ liệu sai: endsAt không sau startsAt, PERCENT ngoài 1 đến 100 hoặc thiếu mức giảm tối đa, FIXED mà có mức giảm tối đa
      PromotionsService-->>AdminPromotionsPage: 400
    else Mã đã tồn tại
      PromotionsService-->>AdminPromotionsPage: 409
    else Hợp lệ
      PromotionsService->>DB: lưu Promotion
      PromotionsService-->>AdminPromotionsPage: 201
    end
  end

  opt UC58 Cập nhật mã khuyến mãi
    Manager->>AdminPromotionsPage: onUpdate(promotionId, form)
    AdminPromotionsPage->>PromotionsController: PATCH /admin/promotions/:id
    PromotionsController->>PromotionsService: update(promotionId, dto)
    PromotionsService->>DB: cập nhật Promotion
    PromotionsService-->>AdminPromotionsPage: 200 (404 nếu không có)
  end

  opt UC59 Vô hiệu hóa mã khuyến mãi
    Manager->>AdminPromotionsPage: onDeactivate(promotionId)
    AdminPromotionsPage->>PromotionsController: PATCH /admin/promotions/:id/deactivate
    PromotionsController->>PromotionsService: deactivate(promotionId)
    PromotionsService->>DB: isActive = false, đơn cũ không đổi
    PromotionsService-->>AdminPromotionsPage: 200
  end
```

## B. Khóa / mở khóa tài khoản và hiệu lực lên JWT (UC62, BR17)

```mermaid
sequenceDiagram
  autonumber
  actor Manager as Quản lý
  actor Customer as Khách hàng
  participant AdminUsersPage
  participant UsersController
  participant UsersService
  participant JwtAuthGuard
  participant JwtStrategy
  participant DB

  Manager->>AdminUsersPage: onToggleActive(userId, isActive)
  AdminUsersPage->>UsersController: PATCH /admin/users/:id/active
  UsersController->>UsersService: setActive(userId, isActive)
  alt Tự khóa chính mình
    UsersService-->>AdminUsersPage: 422
  else Hợp lệ
    UsersService->>DB: cập nhật isActive
    UsersService-->>AdminUsersPage: 200
  end

  Note over Customer,DB: Lần gọi kế tiếp của khách đang giữ JWT cũ
  Customer->>JwtAuthGuard: canActivate(context)
  JwtAuthGuard->>JwtStrategy: validate(payload)
  JwtStrategy->>UsersService: findById(userId)
  UsersService->>DB: đọc User
  alt isActive = false
    JwtStrategy-->>Customer: 403 Tài khoản bị khóa
  else isActive = true
    JwtStrategy-->>Customer: cho qua
  end
```

## B3. Tạo tài khoản nhân viên (UC75, bổ sung ngoài BFD gốc)

```mermaid
sequenceDiagram
  autonumber
  actor Manager as Quản lý
  participant AdminUsersPage
  participant UsersController
  participant UsersService
  participant DB

  Manager->>AdminUsersPage: onCreateStaff(form)
  AdminUsersPage->>UsersController: POST /admin/staff
  UsersController->>UsersService: createStaff(dto)
  UsersService->>UsersService: findByPhone(phone)
  alt Số điện thoại đã dùng
    UsersService-->>AdminUsersPage: 409
  else Dữ liệu sai (số điện thoại, mật khẩu dưới 8 ký tự, thiếu họ tên)
    UsersService-->>AdminUsersPage: 400
  else Hợp lệ
    UsersService->>DB: lưu User vai trò STAFF, isPhoneVerified = true, mật khẩu băm bcrypt
    UsersService-->>AdminUsersPage: 201 tài khoản nhân viên
  end
```

Quản lý đưa số điện thoại và mật khẩu khởi tạo cho nhân viên; nhân viên đăng nhập rồi tự đổi mật khẩu (UC06). Khóa tài khoản nhân viên dùng UC62 (mục B).

## B2. Thiết lập tích điểm và thưởng (UC69, bổ sung ngoài BFD gốc)

Quản lý chỉnh **tỉ lệ tích điểm** (mỗi bao nhiêu đồng được bao nhiêu điểm) và các **quy tắc thưởng** (cứ mỗi N điểm hoặc N ly thì tặng một mã riêng loại nào, hạn bao nhiêu ngày). Quy tắc: BR11, BR40.

```mermaid
sequenceDiagram
  autonumber
  actor Manager as Quản lý
  participant AdminLoyaltyPage
  participant LoyaltyController
  participant LoyaltyService
  participant DB

  Manager->>AdminLoyaltyPage: load()
  AdminLoyaltyPage->>LoyaltyController: GET /admin/loyalty/settings
  LoyaltyController->>LoyaltyService: getSettings()
  LoyaltyService->>DB: đọc LoyaltySetting
  AdminLoyaltyPage->>LoyaltyController: GET /admin/loyalty/rules
  LoyaltyController->>LoyaltyService: listRules()
  LoyaltyService->>DB: đọc các RewardRule
  LoyaltyService-->>AdminLoyaltyPage: 200 tỉ lệ tích điểm và danh sách quy tắc

  opt Đổi tỉ lệ tích điểm
    Manager->>AdminLoyaltyPage: onSaveSettings(form)
    AdminLoyaltyPage->>LoyaltyController: PATCH /admin/loyalty/settings
    LoyaltyController->>LoyaltyService: updateSettings(dto)
    alt amountStep dưới 1000 hoặc pointsPerStep dưới 1
      LoyaltyService-->>AdminLoyaltyPage: 400
    else Hợp lệ
      LoyaltyService->>DB: cập nhật LoyaltySetting
      LoyaltyService-->>AdminLoyaltyPage: 200
    end
  end

  opt Thêm quy tắc thưởng
    Manager->>AdminLoyaltyPage: onCreateRule(form)
    AdminLoyaltyPage->>LoyaltyController: POST /admin/loyalty/rules
    LoyaltyController->>LoyaltyService: createRule(dto)
    alt Mốc hoặc loại mã sai (PERCENT thiếu mức tối đa, validDays ngoài 1 đến 365)
      LoyaltyService-->>AdminLoyaltyPage: 400
    else Hợp lệ
      LoyaltyService->>DB: lưu RewardRule
      LoyaltyService-->>AdminLoyaltyPage: 201
    end
  end

  opt Sửa quy tắc thưởng
    Manager->>AdminLoyaltyPage: onUpdateRule(ruleId, form)
    AdminLoyaltyPage->>LoyaltyController: PATCH /admin/loyalty/rules/:id
    LoyaltyController->>LoyaltyService: updateRule(ruleId, dto)
    LoyaltyService->>DB: cập nhật RewardRule
    LoyaltyService-->>AdminLoyaltyPage: 200 (404 nếu không có). Mã thưởng đã cấp không đổi
  end

  opt Bật hoặc tắt quy tắc
    Manager->>AdminLoyaltyPage: onToggleRule(ruleId, isActive)
    AdminLoyaltyPage->>LoyaltyController: PATCH /admin/loyalty/rules/:id/active
    LoyaltyController->>LoyaltyService: setRuleActive(ruleId, isActive)
    LoyaltyService->>DB: cập nhật isActive
    LoyaltyService-->>AdminLoyaltyPage: 200
  end
```

Đổi tỉ lệ hay quy tắc chỉ áp dụng cho các đơn thanh toán **từ lúc đổi trở đi**; điểm và mã đã cấp không bị tính lại.

## C. Ánh xạ từng UC sang hàm (cùng khuôn mục A)

| UC | Trang | Controller | Service | Ghi chú |
|---|---|---|---|---|
| UC48 | AdminCategoriesPage.load | CategoriesController.adminList | CategoriesService.listAll | |
| UC49 | AdminCategoriesPage.onCreate | CategoriesController.create | CategoriesService.create | Tên trùng → 409 |
| UC50 | AdminCategoriesPage.onUpdate | CategoriesController.update | CategoriesService.update | |
| UC51 | AdminCategoriesPage.onToggleVisibility | CategoriesController.setVisibility | CategoriesService.setVisibility | Ẩn danh mục thì sản phẩm của nó ẩn khỏi menu (BR01) |
| UC52 | AdminToppingsPage.load | ToppingsController.adminList | ToppingsService.listAll | |
| UC53 | AdminToppingsPage.onCreate | ToppingsController.create | ToppingsService.create | Tên trùng → 409 |
| UC54 | AdminToppingsPage.onUpdate | ToppingsController.update | ToppingsService.update | Đơn cũ không đổi (BR26) |
| UC55 | AdminToppingsPage.onToggleAvailability | ToppingsController.setAvailability | ToppingsService.setAvailability | |
| UC56 | AdminPromotionsPage.load | PromotionsController.adminList | PromotionsService.listAll | Vẽ ở mục A |
| UC57 | AdminPromotionsPage.onCreate | PromotionsController.create | PromotionsService.create | Vẽ ở mục A |
| UC58 | AdminPromotionsPage.onUpdate | PromotionsController.update | PromotionsService.update | Vẽ ở mục A |
| UC59 | AdminPromotionsPage.onDeactivate | PromotionsController.deactivate | PromotionsService.deactivate | Vẽ ở mục A |
| UC60 | AdminUsersPage.load | UsersController.adminList | UsersService.list | Chỉ role CUSTOMER |
| UC61 | AdminUsersPage.onOpen | UsersController.adminGetOne | UsersService.getDetail | |
| UC62 | AdminUsersPage.onToggleActive | UsersController.adminSetActive | UsersService.setActive | Vẽ ở mục B |
| UC63 | AdminUsersPage.onViewPoints | UsersController.adminGetPoints | LoyaltyService.getBalance | |
| UC75 | AdminUsersPage.onCreateStaff | UsersController.adminCreateStaff | UsersService.createStaff | Vẽ ở mục B3 |
| UC69 | AdminLoyaltyPage.load, onSaveSettings, onCreateRule, onUpdateRule, onToggleRule | LoyaltyController.adminGetSettings, adminUpdateSettings, adminListRules, adminCreateRule, adminUpdateRule, adminSetRuleActive | LoyaltyService.getSettings, updateSettings, listRules, createRule, updateRule, setRuleActive | Vẽ ở mục B2 |
