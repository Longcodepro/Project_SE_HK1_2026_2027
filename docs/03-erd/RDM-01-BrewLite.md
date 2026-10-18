# 03 · RDM — Lược đồ quan hệ

Chuyển từ `ERD-01-BrewLite.md` sang bảng. Kiểu cột viết theo PostgreSQL. Tiền là số nguyên đồng (VND), không có số lẻ. Thời gian là `timestamptz`. Ký hiệu: **PK** khóa chính, **FK** khóa ngoại, **UK** duy nhất, **NN** không null.

## Các bảng

### user
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| id | serial | PK |
| phone | varchar(10) | UK, NN, 10 chữ số bắt đầu bằng 0 (BR22) |
| isPhoneVerified | boolean | NN, mặc định `false`; thành `true` sau khi nhập đúng OTP (BR27) |
| email | varchar(255) | UK, **null được**, lưu chữ thường; nhiều dòng `NULL` vẫn hợp lệ (BR22) |
| passwordHash | varchar(255) | NN |
| fullName | varchar(100) | NN |
| role | Role | NN, mặc định `CUSTOMER` |
| isActive | boolean | NN, mặc định `true` (BR17) |
| loyaltyPoints | int | NN, mặc định 0, ≥ 0: tổng điểm tích lũy (BR11, BR40) |
| walletBalance | int | NN, mặc định 0, ≥ 0: số dư ví **chỉ nhận hoàn tiền**, không dùng thanh toán đơn (BR43) |
| totalCups | int | NN, mặc định 0, ≥ 0: tổng số ly đã mua (đơn đã thanh toán), dùng cho thưởng theo mốc ly (BR40) |
| createdAt | timestamptz | NN, mặc định now |

### category
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| id | serial | PK |
| name | varchar(100) | UK, NN |
| isVisible | boolean | NN, mặc định `true` |

### product
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| id | serial | PK |
| categoryId | int | FK → category.id, NN |
| name | varchar(150) | NN |
| description | text | null được |
| imageUrl | varchar(500) | null được |
| status | ProductStatus | NN, mặc định `ON_SALE`: `ON_SALE` còn bán, `SOLD_OUT` hết bán (UC39), `LOCKED` khóa bán (UC47) (BR02) |
| allowHot | boolean | NN, mặc định `false`: món có bán nóng không (BR35) |
| allowCold | boolean | NN, mặc định `true`: món có bán lạnh không. Ít nhất một trong `allowHot`, `allowCold` là `true` |
| defaultTemperature | Temperature | NN, phải thuộc nhiệt độ đang được phép |
| maxPerTopping | int | NN: số phần tối đa của **mỗi loại** topping trong một ly (BR37). Món có topping: `1 ≤ maxPerTopping ≤ maxToppingTotal`; món không có topping: 0 |
| maxToppingTotal | int | NN: **tổng** số phần topping tối đa trong một ly, từ 0 đến 10 (BR37) |
| dailyQuota | int | NN, mặc định 0, ≥ 0: số ly tối đa quản lý nhập lần gần nhất, dùng cho UC77 (BR49) |
| stockRemaining | int | NN, mặc định 0, ≥ 0: số ly còn lại của ngày `stockDate` (BR49, BR50) |
| stockDate | timestamptz | **null được**: thời điểm nhập gần nhất, chỉ so phần ngày; khác hôm nay thì số ly còn lại coi như 0 |
| stockVersion | int | NN, mặc định 0: tăng mỗi lần trừ hoặc đặt lại số ly, dùng cho optimistic locking (BR50) |
| iceMin, iceMax, iceDefault | int | NN, `0 ≤ iceMin ≤ iceDefault ≤ iceMax ≤ 100` |
| sugarMin, sugarMax, sugarDefault | int | NN, `0 ≤ sugarMin ≤ sugarDefault ≤ sugarMax ≤ 100` |

### product_size
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| id | serial | PK |
| productId | int | FK → product.id, NN, xóa theo sản phẩm |
| sizeCode | SizeCode | NN |
| price | int | NN, ≥ 0 |
| volumeMl | int | **null được**; nếu có thì từ 1 đến 2000 (ml) (BR34) |
| | | UK (productId, sizeCode) |

### topping
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| id | serial | PK |
| name | varchar(100) | UK, NN |
| price | int | NN, ≥ 0 |
| isAvailable | boolean | NN, mặc định `true` (UC55) |

### product_topping
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| productId | int | PK một phần, FK → product.id |
| toppingId | int | PK một phần, FK → topping.id |

### promotion
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| id | serial | PK |
| code | varchar(50) | UK, NN, lưu chữ hoa |
| scope | PromotionScope | NN: `PUBLIC` mã chung, `PERSONAL` mã riêng (BR39) |
| userId | int | FK → user.id; **bắt buộc khi `PERSONAL`**, null khi `PUBLIC` |
| ruleId | int | FK → reward_rule.id; có khi mã do quy tắc thưởng sinh ra (BR40), null với mã quản lý tạo tay |
| discountType | DiscountType | NN: `PERCENT`, `FIXED` hoặc `FREE_DRINK` |
| discountValue | int | `PERCENT`: từ 1 đến 100. `FIXED`: số tiền đồng > 0. `FREE_DRINK`: null |
| maxDiscountAmount | int | `PERCENT`: **bắt buộc**, > 0, mức giảm tối đa (đồng). `FREE_DRINK`: tùy chọn, mức tối đa cho giá ly được tặng; nếu quản lý không đặt thì ly được tặng giảm hết giá. `FIXED`: null (BR07) |
| minOrderAmount | int | NN, mặc định 0 |
| maxTotalUses | int | null là không giới hạn tổng lượt; `PERSONAL` luôn là 1 (BR39) |
| maxUsesPerUser | int | NN, mặc định 1: mỗi khách dùng tối đa bao nhiêu lần (BR39) |
| startsAt, endsAt | timestamptz | NN, `endsAt > startsAt` |
| isActive | boolean | NN, mặc định `true` (UC59) |

### order (viết `"order"` trong SQL vì trùng từ khóa)
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| id | serial | PK |
| orderCode | varchar(20) | UK, NN (BR25) |
| userId | int | FK → user.id, NN |
| promotionId | int | FK → promotion.id, null được |
| promotionCode | varchar(50) | null được: ảnh chụp mã đã dùng, để in lên hóa đơn (BR26, BR38) |
| status | OrderStatus | NN, mặc định `PENDING` |
| subtotal | int | NN, ≥ 0 |
| discountAmount | int | NN, mặc định 0 |
| totalAmount | int | NN, ≥ 0 (BR08) |
| pointsAwarded | int | NN, mặc định 0, ≥ 0: số điểm `LoyaltyService.award` đã cộng cho đơn này lúc `PAID`; hủy đơn đã trả tiền thì trừ lại đúng số này (BR51) |
| pickupCode | char(6) | UK, null được; có từ khi `READY` (BR12) |
| cancelReason | CancelReason | null được; có khi `CANCELLED` |
| cancelledByUserId | int | FK → user.id, null được: người hủy (khách hoặc nhân viên), có khi `CANCELLED` (BR13) |
| cancelNote | varchar(200) | null được: lý do hủy; **bắt buộc khi nhân viên hủy** (từ 5 ký tự), khách tự hủy thì để trống được (BR13) |
| createdAt, updatedAt | timestamptz | NN |

### order_item
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| id | serial | PK |
| orderId | int | FK → order.id, NN |
| productId | int | FK → product.id, NN |
| productName | varchar(150) | NN (ảnh chụp, BR26) |
| sizeCode | SizeCode | NN |
| sizeVolumeMl | int | null được (ảnh chụp dung tích size lúc đặt, BR26, BR34) |
| unitPrice | int | NN, ≥ 0 |
| iceLevel, sugarLevel | int | NN; `iceLevel = 0` khi chọn nóng (BR35) |
| temperature | Temperature | NN |
| note | varchar(200) | null được: ghi chú của khách cho dòng này, tối đa 20 từ và không quá 200 ký tự (BR36) |
| quantity | int | NN, ≥ 1 |
| lineTotal | int | NN, `= unitPrice × quantity` |

### order_item_topping
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| id | serial | PK |
| orderItemId | int | FK → order_item.id, NN |
| toppingId | int | FK → topping.id, NN |
| toppingName | varchar(100) | NN (ảnh chụp) |
| price | int | NN (ảnh chụp), giá **một phần** |
| quantity | int | NN, ≥ 1: số phần topping này trong một ly (BR37) |

### payment
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| id | serial | PK |
| orderId | int | FK → order.id, NN |
| method | PaymentMethod | NN |
| amount | int | NN, > 0 |
| status | PaymentStatus | NN |
| idempotencyKey | varchar(100) | UK, NN (BR10) |
| gatewayRef | varchar(100) | null được |
| cardLast4 | char(4) | null được: 4 số cuối thẻ, chỉ với `CARD` (không lưu số thẻ, hạn, CVV) (BR41) |
| transferRef | varchar(30) | null được: mã tham chiếu khách ghi khi chuyển khoản, chỉ với `TRANSFER` (BR41) |
| expiresAt | timestamptz | null được: hạn 10 phút, chỉ với `TRANSFER` (BR41) |
| createdAt | timestamptz | NN |

### refund
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| id | serial | PK |
| orderId | int | FK → order.id, NN |
| paymentId | int | FK → payment.id, NN (lần thanh toán `SUCCESS` được hoàn) |
| amount | int | NN, > 0 |
| reason | RefundReason | NN |
| createdByUserId | int | FK → user.id, NN: người gây ra hoàn tiền (khách tự hủy, hoặc nhân viên) |
| note | varchar(200) | null được: lý do (bắt buộc khi `MISSING_ITEM`) |
| createdAt | timestamptz | NN |

Hoàn tiền **luôn cộng vào ví** của khách (`wallet_transaction` loại `REFUND_IN`), không trả về cổng thanh toán (BR43).

### wallet_transaction
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| id | serial | PK |
| userId | int | FK → user.id, NN |
| type | WalletTxType | NN |
| amount | int | NN: dương là cộng, âm là trừ; `walletBalance` luôn bằng tổng `amount` |
| refundId | int | FK → refund.id, null được: có với `REFUND_IN` |
| withdrawalId | int | FK → withdrawal_request.id, null được: có với `WITHDRAW_OUT` và `WITHDRAW_RETURN` |
| createdAt | timestamptz | NN |

### withdrawal_request
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| id | serial | PK |
| userId | int | FK → user.id, NN |
| amount | int | NN, ≥ 10.000 và ≤ số dư ví lúc gửi (BR44) |
| destinationType | DestinationType | NN |
| accountName | varchar(100) | NN: tên chủ tài khoản |
| accountNumber | varchar(30) | NN: số ví, số thẻ hoặc số tài khoản nhận |
| bankName | varchar(100) | null được; **bắt buộc khi** `destinationType = BANK` hoặc `CARD` |
| status | WithdrawalStatus | NN, mặc định `PENDING` |
| rejectReason | varchar(200) | null được; bắt buộc khi `REJECTED` |
| transferRef | varchar(50) | null được; mã giao dịch chuyển thủ công, bắt buộc khi `COMPLETED` |
| handledByUserId | int | FK → user.id, null được: quản lý xử lý |
| handledAt | timestamptz | null được |
| createdAt | timestamptz | NN |

### item_issue (món không làm được, xử lý trước khi giao)
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| id | serial | PK |
| orderId | int | FK → order.id, NN |
| orderItemId | int | FK → order_item.id, NN |
| quantity | int | NN, ≥ 1 và ≤ số ly còn lại chưa xử lý của dòng |
| resolution | ItemResolution | NN |
| refundId | int | FK → refund.id, null được: có khi `REFUND_TO_WALLET` |
| note | varchar(200) | NN: lý do, từ 5 ký tự |
| handledByUserId | int | FK → user.id, NN: nhân viên xử lý |
| createdAt | timestamptz | NN |

### otp_code
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| id | serial | PK |
| phone | varchar(10) | NN, không có khóa ngoại (OTP phát sinh trước khi xác thực xong) |
| purpose | OtpPurpose | NN: `REGISTER` (UC01) hoặc `RESET_PASSWORD` (UC68), mã chỉ dùng đúng mục đích (BR31) |
| codeHash | varchar(255) | NN, lưu băm, không lưu mã gốc |
| expiresAt | timestamptz | NN, bằng `createdAt` + 5 phút (BR27) |
| attempts | int | NN, mặc định 0; từ 5 lần nhập sai thì mã mất hiệu lực |
| consumedAt | timestamptz | null được; có giá trị khi đã dùng thành công |
| createdAt | timestamptz | NN |

### notification
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| id | serial | PK |
| userId | int | FK → user.id, NN |
| orderId | int | FK → order.id, **null được** (null với `REWARD_ISSUED` và hai sự kiện rút tiền, vì không thuộc riêng đơn nào) |
| event | NotificationEvent | NN |
| channel | NotificationChannel | NN |
| recipient | varchar(255) | NN, số điện thoại hoặc email lúc gửi |
| content | text | NN |
| status | NotificationStatus | NN |
| createdAt | timestamptz | NN |

### revoked_token
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| id | serial | PK |
| jti | varchar(64) | UK, NN, mã định danh duy nhất của JWT đã đăng xuất |
| userId | int | FK → user.id, NN |
| expiresAt | timestamptz | NN, bằng hạn của JWT (7 ngày kể từ lúc cấp); quá hạn này dòng được dọn |
| createdAt | timestamptz | NN |

### promotion_usage
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| id | serial | PK |
| promotionId | int | FK → promotion.id, NN |
| userId | int | FK → user.id, NN |
| orderId | int | FK → order.id, **UK**, NN: một đơn chỉ dùng một mã (BR39) |
| createdAt | timestamptz | NN: ghi lúc **tạo đơn** (giữ chỗ lượt dùng) |
| releasedAt | timestamptz | null được: có giá trị khi đơn bị hủy, lượt dùng được trả lại |

Số lượt đang tính của một mã là số dòng có `releasedAt` rỗng.

### reward_rule
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| id | serial | PK |
| name | varchar(100) | NN |
| kind | RewardKind | NN: `POINTS` hoặc `CUPS` |
| threshold | int | NN, ≥ 1: **cứ mỗi bấy nhiêu điểm** (hoặc ly) khách đạt thêm thì được một mã (BR40) |
| discountType | DiscountType | NN: loại mã thưởng |
| discountValue | int | như `promotion.discountValue` |
| maxDiscountAmount | int | như `promotion.maxDiscountAmount` |
| minOrderAmount | int | NN, mặc định 0 |
| validDays | int | NN, 1 đến 365: mã thưởng có hạn dùng bấy nhiêu ngày kể từ lúc cấp |
| isActive | boolean | NN, mặc định `true` |

### loyalty_setting (luôn đúng một dòng, `id = 1`)
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| id | int | PK, bằng 1 |
| amountStep | int | NN, ≥ 1000: cứ mỗi bấy nhiêu đồng (mặc định 10.000) |
| pointsPerStep | int | NN, ≥ 1: được bấy nhiêu điểm (mặc định 10) (BR11) |

### promotion_product (danh sách món được tặng của mã `FREE_DRINK`)
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| promotionId | int | PK một phần, FK → promotion.id |
| productId | int | PK một phần, FK → product.id |

Mã `FREE_DRINK` phải có ít nhất một dòng. Khách chỉ chọn được ly có món thuộc danh sách (BR07).

### reward_rule_product (danh sách món được tặng của quy tắc thưởng `FREE_DRINK`)
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| ruleId | int | PK một phần, FK → reward_rule.id |
| productId | int | PK một phần, FK → product.id |

Khi cấp mã thưởng, danh sách này được sao sang `promotion_product` của mã mới (BR40).

### service_feedback
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| id | serial | PK |
| orderId | int | FK → order.id, **UK**, NN: mỗi đơn tối đa một phản hồi (BR14) |
| userId | int | FK → user.id, NN: chủ đơn |
| rating | int | NN, từ 1 đến 5 sao |
| comment | varchar(300) | null được: nhận xét, tối đa 50 từ và không quá 300 ký tự |
| createdAt | timestamptz | NN |

## Ràng buộc liên bảng (kiểm ở service, không ở DB)

| Ràng buộc | Nơi kiểm | Quy tắc |
|---|---|---|
| `Σ Refund.amount ≤ Σ Payment.amount (SUCCESS)` của cùng đơn (và tổng hoàn theo `MISSING_ITEM` không vượt `totalAmount`) | `RefundsService.refund` | BR16, BR45 |
| `user.walletBalance = Σ wallet_transaction.amount` của khách và luôn ≥ 0 | `WalletService` (`credit`, `requestWithdrawal`, `rejectWithdrawal`) | BR43, BR44 |
| Yêu cầu rút chỉ xử lý được khi `status = PENDING`; `COMPLETED` cần `transferRef`, `REJECTED` cần `rejectReason` | `WalletService.completeWithdrawal`, `WalletService.rejectWithdrawal` | BR44 |
| `item_issue.quantity` không vượt số ly còn lại của dòng (`quantity` của dòng trừ tổng đã xử lý); chỉ khi đơn ở `PAID`, `PREPARING`, `READY` | `OrdersService.handleMissingItem` | BR45 |
| Phản hồi dịch vụ chỉ tạo được khi đơn `COMPLETED` và chưa có phản hồi | `FeedbackService.submit` | BR14 |
| Nhân viên hủy đơn thì `cancelNote` từ 5 ký tự; `cancelledByUserId` luôn có khi `CANCELLED` | `OrdersService.cancelOrder` | BR13 |
| Món có ít nhất một `product_size`; ít nhất một trong `allowHot`, `allowCold` là `true` | `ProductsService.create`, `ProductsService.update` | BR35, UC42 |
| Hủy đơn đã `PAID` thì `user.loyaltyPoints` giảm `order.pointsAwarded` và `user.totalCups` giảm số ly của đơn, cả hai không xuống dưới 0 | `LoyaltyService.revoke` | BR51 |
| `pickupCode` chỉ khác null khi `status ∈ {READY, COMPLETED}` | `OrdersService.updateStatus` | BR12 |
| `remainingToday = stockRemaining` khi `stockDate` là hôm nay, ngược lại 0; tạo đơn chỉ được khi tổng số ly của món trong đơn ≤ `remainingToday`; trừ bằng cập nhật có điều kiện theo `stockVersion` | `ProductsService.reserveStock`, `ProductsService.releaseStock`, `ProductsService.setDailyStock` | BR49, BR50 |
| Topping của dòng đơn phải thuộc `product_topping` của sản phẩm lúc đặt | `ProductsService.validateSelection` | BR05 |
| Chỉ đăng nhập được khi `user.isPhoneVerified = true` | `AuthService.login` | BR27 |
| `payment.idempotencyKey` là duy nhất; `PaymentsService.pay` khóa dòng đơn trong giao dịch để hai yêu cầu cùng key đồng thời không gọi cổng hai lần | `PaymentsService.pay` | BR10 |
| Mã `PERSONAL` chỉ chủ mã dùng được (`promotion.userId = user.id`) | `PromotionsService.validateCode` | BR39 |
| Số lượt đang tính của mã nhỏ hơn `maxTotalUses`, và của mỗi khách nhỏ hơn `maxUsesPerUser` | `PromotionsService.validateCode`, `PromotionsService.recordUsage` | BR39 |
| Số mã thưởng đã cấp theo một quy tắc cho một khách = `floor(điểm hoặc ly / threshold)` | `LoyaltyService.grantRewards` | BR40 |
| Mỗi sự kiện đơn tạo tối đa một `notification` SMS và một EMAIL (EMAIL chỉ khi `user.email` khác null) | `NotificationService.notifyOrderEvent` | BR28 |

## Chỉ mục nên có

`order(userId, createdAt)` cho UC24; `order(status, createdAt)` cho UC31 và thống kê; `product(categoryId)` cho UC09; `payment(orderId)` cho UC33; `otp_code(phone, createdAt)` để lấy mã mới nhất; `notification(orderId)`; `revoked_token(expiresAt)` để dọn dòng hết hạn; `wallet_transaction(userId, createdAt)`; `withdrawal_request(status, createdAt)` cho UC73; `item_issue(createdAt)` và `service_feedback(createdAt)` cho danh sách quản trị.
