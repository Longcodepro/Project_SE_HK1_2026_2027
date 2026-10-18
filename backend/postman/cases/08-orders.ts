import { Case, Folder } from '../lib/dsl';

// Món mẫu trong seed: 1 Cà phê sữa đá (nóng/lạnh, topping 6,5,7,8,12), 5 Espresso (chỉ nóng, không topping),
// 15 Trà dâu tây (hết bán), 17 Trà sữa trân châu (chỉ lạnh), 33 Nước ép cà rốt (chưa nhập số ly), 34 Bánh quy (không đá/đường),
// 38 Croissant (khóa bán), 39 Trà sen vàng (danh mục ẩn).
const line = (over: Record<string, unknown> = {}) => ({ productId: 1, sizeCode: 'M', iceLevel: 50, sugarLevel: 70, temperature: 'COLD', quantity: 1, ...over });
const order = (items: unknown[], extra: Record<string, unknown> = {}) => ({ items, ...extra });
const create = (name: string, body: unknown, status: number, extra: Partial<Case> = {}): Case => ({ name, method: 'POST', path: '/orders', auth: 'ouser', body, status, ...extra });

const anyStaffCancel = (name: string, id: string, status: number): Case => ({ name, method: 'POST', path: `/admin/orders/${id}/cancel`, auth: 'staff', body: { note: 'Thử hủy đơn không hợp lệ' }, status });

const folder: Folder = {
  name: '08 · Đơn hàng (orders)',
  description: 'UC18 tạo đơn, UC24-26 xem đơn và hóa đơn, UC27/36 hủy đơn, UC28/37 phản hồi, UC30-35 quản trị đơn.',
  cases: [
    { name: 'Tạo khách mới: đăng ký', method: 'POST', path: '/auth/register', set: { phoneO: 'phone' }, body: { phone: '{{phoneO}}', password: 'Matkhau123', fullName: 'Khách Đặt Hàng' }, status: 201 },
    { name: 'Tạo khách mới: xác thực OTP', method: 'POST', path: '/auth/verify-otp', body: { phone: '{{phoneO}}', code: '123456' }, status: 200, save: { ouserToken: 'token' } },
    // Món riêng có đúng 2 ly để thử hết số ly mà không ảnh hưởng món khác
    { name: 'Tạo món thử có số ly giới hạn', method: 'POST', path: '/admin/products', auth: 'manager', body: { categoryId: 1, name: 'Món thử tồn kho', sizes: [{ sizeCode: 'M', price: 20000 }] }, status: 201, save: { stockProductId: 'id' } },
    { name: 'Nhập 2 ly cho món thử', method: 'PUT', path: '/admin/products/{{stockProductId}}/daily-stock', auth: 'manager', body: { quantity: 2 }, status: 200 },

    // ───── POST /orders: thành công ─────
    create('[201] Đơn một dòng có topping, tính giá đúng', order([line({ quantity: 2, toppings: [{ toppingId: 6, quantity: 1 }, { toppingId: 5, quantity: 2 }] })]), 201, {
      save: { orderId1: 'id' },
      expect: [{ path: 'status', equals: 'PENDING' }, { path: 'subtotal', equals: 128000 }, { path: 'discountAmount', equals: 0 }, { path: 'totalAmount', equals: 128000 }, { path: 'items.0.unitPrice', equals: 64000 }, { path: 'items.0.lineTotal', equals: 128000 }, { path: 'items.0.toppings', isArray: true, min: 2 }, { path: 'items.0.productName', equals: 'Cà phê sữa đá' }, { path: 'items.0.sizeVolumeMl', equals: 460 }, { path: 'orderCode', matches: '^BL\\d{10}$' }, { path: 'pickupCode', equals: null }, { path: 'payments', equals: [] }],
    }),
    create('[201] Đơn nhiều dòng: espresso nóng có ghi chú và bánh', order([line({ productId: 5, sizeCode: 'S', iceLevel: 0, sugarLevel: 25, temperature: 'HOT', note: 'ít ngọt giúp mình' }), line({ productId: 34, iceLevel: 0, sugarLevel: 0 })]), 201, {
      save: { orderId2: 'id' },
      expect: [{ path: 'subtotal', equals: 55000 }, { path: 'items', isArray: true, min: 2 }, { path: 'items.0.note', equals: 'ít ngọt giúp mình' }, { path: 'items.0.temperature', equals: 'HOT' }],
    }),
    create('[201] Đơn dùng mã giảm % (WELCOME10)', order([line({ quantity: 2 })], { promotionCode: 'WELCOME10' }), 201, { save: { orderId3: 'id' }, expect: [{ path: 'subtotal', equals: 64000 }, { path: 'discountAmount', equals: 6400 }, { path: 'totalAmount', equals: 57600 }, { path: 'promotionCode', equals: 'WELCOME10' }] }),
    create('[422] Dùng lại mã WELCOME10 khi đã hết số lần của khách', order([line({ quantity: 2 })], { promotionCode: 'WELCOME10' }), 422),
    { name: '[200] Hủy đơn dùng mã', method: 'POST', path: '/orders/{{orderId3}}/cancel', auth: 'ouser', body: {}, status: 200, expect: [{ path: 'status', equals: 'CANCELLED' }] },
    create('[201] Hủy đơn thì được trả lại lượt dùng mã (dùng lại được)', order([line({ quantity: 2 })], { promotionCode: 'welcome10' }), 201, { save: { orderId3b: 'id' }, expect: [{ path: 'promotionCode', equals: 'WELCOME10' }] }),
    create('[201] Đơn dùng mã tặng ly, giảm đúng giá ly được chọn', order([line({ quantity: 1 }), line({ productId: 5, sizeCode: 'S', iceLevel: 0, temperature: 'HOT' })], { promotionCode: 'FREECUP', freeCupLine: 0 }), 201, { save: { orderId4: 'id' }, expect: [{ path: 'subtotal', equals: 62000 }, { path: 'discountAmount', equals: 32000 }, { path: 'totalAmount', equals: 30000 }] }),
    create('[422] Mã tặng ly nhưng không chọn ly', order([line()], { promotionCode: 'FREECUP' }), 422),
    create('[422] Mã tặng ly: dòng chọn không thuộc danh sách món', order([line(), line({ productId: 5, sizeCode: 'S', iceLevel: 0, temperature: 'HOT' })], { promotionCode: 'FREECUP', freeCupLine: 1 }), 422),
    create('[422] Mã tặng ly: dòng chọn không tồn tại trong đơn', order([line()], { promotionCode: 'FREECUP', freeCupLine: 5 }), 422),
    create('[422] Mã không tồn tại', order([line()], { promotionCode: 'KHONGCOMA' }), 422),
    create('[422] Mã hết hạn', order([line({ quantity: 3 })], { promotionCode: 'HETHAN01' }), 422),
    create('[422] Mã chưa đủ đơn tối thiểu', order([line({ productId: 34, iceLevel: 0, sugarLevel: 0 })], { promotionCode: 'GIAM20K' }), 422),
    create('[422] Mã đã hết lượt toàn hệ thống (CHILAN1)', order([line()], { promotionCode: 'CHILAN1' }), 422),

    // ───── POST /orders: dữ liệu sai (400) ─────
    create('[400] Đơn không có món', order([]), 400),
    create('[400] Thiếu danh sách món', {}, 400),
    create('[400] Số lượng bằng 0', order([line({ quantity: 0 })]), 400),
    create('[400] Số lượng vượt 20 ly', order([line({ quantity: 21 })]), 400),
    create('[400] Size không hợp lệ', order([line({ sizeCode: 'XL' })]), 400),
    create('[400] Nhiệt độ không hợp lệ', order([line({ temperature: 'WARM' })]), 400),
    create('[400] Mức đá không phải số', order([line({ iceLevel: 'nhiều' })]), 400),
    create('[400] Topping có số phần bằng 0', order([line({ toppings: [{ toppingId: 6, quantity: 0 }] })]), 400),
    create('[400] Ghi chú quá 200 ký tự', order([line({ note: 'a'.repeat(201) })]), 400),
    create('[400] Thiếu productId', order([{ sizeCode: 'M', iceLevel: 50, sugarLevel: 50, temperature: 'COLD', quantity: 1 }]), 400),

    // ───── POST /orders: món không đặt được ─────
    create('[404] Món không tồn tại', order([line({ productId: 999999 })]), 404),
    create('[404] Món bị khóa bán', order([line({ productId: 38 })]), 404),
    create('[404] Món thuộc danh mục đang ẩn', order([line({ productId: 39 })]), 404),
    create('[422] Món hết bán', order([line({ productId: 15 })]), 422),
    create('[422] Món chưa nhập số ly hôm nay', order([line({ productId: 33 })]), 422),
    create('[422] Món không có size này', order([line({ productId: 5, sizeCode: 'L', iceLevel: 0, temperature: 'HOT' })]), 422),
    create('[422] Chọn lạnh cho món chỉ phục vụ nóng', order([line({ productId: 5, sizeCode: 'S', iceLevel: 0, temperature: 'COLD' })]), 422),
    create('[422] Chọn nóng cho món chỉ phục vụ lạnh', order([line({ productId: 17, iceLevel: 0, temperature: 'HOT' })]), 422),
    create('[422] Chọn nóng nhưng mức đá khác 0', order([line({ temperature: 'HOT', iceLevel: 25 })]), 422),
    create('[422] Mức đá vượt khoảng cho phép', order([line({ iceLevel: 150 })]), 422),
    create('[422] Mức đường âm', order([line({ sugarLevel: -5 })]), 422),
    create('[422] Topping không thuộc món', order([line({ toppings: [{ toppingId: 4, quantity: 1 }] })]), 422),
    create('[422] Topping đang khóa bán', order([line({ toppings: [{ toppingId: 9, quantity: 1 }] })]), 422),
    create('[422] Món không có topping mà vẫn chọn topping', order([line({ productId: 5, sizeCode: 'S', iceLevel: 0, temperature: 'HOT', toppings: [{ toppingId: 6, quantity: 1 }] })]), 422),
    create('[422] Quá số phần mỗi loại topping', order([line({ toppings: [{ toppingId: 6, quantity: 3 }] })]), 422),
    create('[422] Quá tổng số phần topping', order([line({ toppings: [{ toppingId: 6, quantity: 2 }, { toppingId: 5, quantity: 2 }] })]), 422),
    create('[422] Chọn trùng một topping trong một dòng', order([line({ toppings: [{ toppingId: 6, quantity: 1 }, { toppingId: 6, quantity: 1 }] })]), 422),
    create('[422] Ghi chú quá 20 từ', order([line({ note: Array(21).fill('từ').join(' ') })]), 422),

    // ───── Số ly trong ngày (BR49, BR50) ─────
    create('[422] Đặt 3 ly khi chỉ còn 2', order([line({ productId: '@stockProductId', sizeCode: 'M', quantity: 3 })]), 422),
    create('[422] Một dòng đủ ly, dòng kia hết ly: cả đơn bị từ chối', order([line({ productId: '@stockProductId', sizeCode: 'M', quantity: 1 }), line({ productId: 33 })]), 422),
    { name: '[200] Đơn bị từ chối không làm mất số ly đã giữ', method: 'GET', path: '/products/{{stockProductId}}', status: 200, expect: [{ path: 'remainingToday', equals: 2 }] },
    create('[201] Đặt đủ 2 ly cuối', order([line({ productId: '@stockProductId', sizeCode: 'M', quantity: 2 })]), 201, { save: { stockOrderId: 'id' } }),
    { name: '[200] Hết ly thì món không còn đặt được', method: 'GET', path: '/products/{{stockProductId}}', status: 200, expect: [{ path: 'remainingToday', equals: 0 }, { path: 'orderable', equals: false }] },
    create('[422] Đặt thêm khi đã hết ly', order([line({ productId: '@stockProductId', sizeCode: 'M', quantity: 1 })]), 422),
    { name: '[200] Hủy đơn thì trả lại số ly', method: 'POST', path: '/orders/{{stockOrderId}}/cancel', auth: 'ouser', body: {}, status: 200 },
    { name: '[200] Số ly được trả lại', method: 'GET', path: '/products/{{stockProductId}}', status: 200, expect: [{ path: 'remainingToday', equals: 2 }, { path: 'orderable', equals: true }] },

    // ───── POST /orders: quyền ─────
    { name: '[401] Tạo đơn khi chưa đăng nhập', method: 'POST', path: '/orders', body: order([line()]), status: 401 },
    { name: '[403] Nhân viên không đặt hàng được', method: 'POST', path: '/orders', auth: 'staff', body: order([line()]), status: 403 },

    // ───── GET /orders/me, /orders/:id, /orders/:id/bill ─────
    { name: '[200] Lịch sử đơn của khách, mới nhất trước', method: 'GET', path: '/orders/me', auth: 'ouser', status: 200, expect: [{ path: '', isArray: true, min: 5 }, { path: '0.orderCode', matches: '^BL' }, { path: '0.itemCount', min: 1 }, { path: '0.totalAmount', exists: true }] },
    { name: '[200] Khách mẫu có nhiều đơn', method: 'GET', path: '/orders/me', auth: 'customer', status: 200, expect: [{ path: '', isArray: true, min: 10 }] },
    { name: '[401] Lịch sử đơn khi chưa đăng nhập', method: 'GET', path: '/orders/me', status: 401 },
    { name: '[403] Nhân viên không có lịch sử đơn', method: 'GET', path: '/orders/me', auth: 'staff', status: 403 },
    { name: '[200] Chi tiết đơn của mình', method: 'GET', path: '/orders/{{orderId1}}', auth: 'ouser', status: 200, expect: [{ path: 'status', equals: 'PENDING' }, { path: 'items.0.toppings.0.toppingName', exists: true }, { path: 'pickupCode', equals: null }, { path: 'feedback', equals: null }] },
    { name: '[404] Đơn của khách khác coi như không tồn tại', method: 'GET', path: '/orders/{{orderId1}}', auth: 'customer', status: 404 },
    { name: '[404] Đơn không tồn tại', method: 'GET', path: '/orders/999999', auth: 'ouser', status: 404 },
    { name: '[400] id không phải số', method: 'GET', path: '/orders/abc', auth: 'ouser', status: 400 },
    { name: '[401] Xem chi tiết đơn khi chưa đăng nhập', method: 'GET', path: '/orders/{{orderId1}}', status: 401 },
    { name: '[409] Đơn chưa thanh toán chưa có hóa đơn', method: 'GET', path: '/orders/{{orderId1}}/bill', auth: 'ouser', status: 409 },
    { name: '[404] Hóa đơn của đơn người khác', method: 'GET', path: '/orders/{{orderId1}}/bill', auth: 'customer', status: 404 },
    { name: '[401] Hóa đơn khi chưa đăng nhập', method: 'GET', path: '/orders/{{orderId1}}/bill', status: 401 },

    // ───── Phản hồi (chỉ kiểm các lỗi; gửi thành công test ở vòng đời đơn) ─────
    { name: '[409] Chưa nhận hàng thì chưa đánh giá được', method: 'POST', path: '/orders/{{orderId1}}/feedback', auth: 'ouser', body: { rating: 5 }, status: 409 },
    { name: '[400] Số sao bằng 0', method: 'POST', path: '/orders/{{orderId1}}/feedback', auth: 'ouser', body: { rating: 0 }, status: 400 },
    { name: '[400] Số sao vượt 5', method: 'POST', path: '/orders/{{orderId1}}/feedback', auth: 'ouser', body: { rating: 6 }, status: 400 },
    { name: '[400] Thiếu số sao', method: 'POST', path: '/orders/{{orderId1}}/feedback', auth: 'ouser', body: {}, status: 400 },
    { name: '[400] Nhận xét quá 300 ký tự', method: 'POST', path: '/orders/{{orderId1}}/feedback', auth: 'ouser', body: { rating: 5, comment: 'a'.repeat(301) }, status: 400 },
    { name: '[404] Đánh giá đơn của người khác', method: 'POST', path: '/orders/{{orderId1}}/feedback', auth: 'customer', body: { rating: 5 }, status: 404 },
    { name: '[404] Đánh giá đơn không tồn tại', method: 'POST', path: '/orders/999999/feedback', auth: 'ouser', body: { rating: 5 }, status: 404 },
    { name: '[401] Đánh giá khi chưa đăng nhập', method: 'POST', path: '/orders/{{orderId1}}/feedback', body: { rating: 5 }, status: 401 },

    // ───── Quản trị: danh sách và chi tiết ─────
    { name: '[200] Nhân viên xem danh sách đơn', method: 'GET', path: '/admin/orders', auth: 'staff', status: 200, expect: [{ path: 'total', min: 340 }, { path: 'pageSize', equals: 20 }, { path: 'items.0.customer.phone', exists: true }, { path: 'items.0.itemCount', min: 1 }] },
    { name: '[200] Lọc đơn đã giao', method: 'GET', path: '/admin/orders', auth: 'staff', query: { status: 'COMPLETED', pageSize: 1 }, status: 200, save: { completedId: 'items.0.id' }, expect: [{ path: 'items.0.status', equals: 'COMPLETED' }] },
    { name: '[200] Lọc đơn đã xong chờ nhận', method: 'GET', path: '/admin/orders', auth: 'staff', query: { status: 'READY', pageSize: 1 }, status: 200, save: { readyId: 'items.0.id' }, expect: [{ path: 'items.0.status', equals: 'READY' }] },
    { name: '[200] Lọc đơn đang pha', method: 'GET', path: '/admin/orders', auth: 'staff', query: { status: 'PREPARING', pageSize: 1 }, status: 200, save: { preparingId: 'items.0.id' }, expect: [{ path: 'items.0.status', equals: 'PREPARING' }] },
    { name: '[200] Lọc đơn đã hủy', method: 'GET', path: '/admin/orders', auth: 'manager', query: { status: 'CANCELLED', pageSize: 1 }, status: 200, save: { cancelledId: 'items.0.id' }, expect: [{ path: 'items.0.status', equals: 'CANCELLED' }] },
    { name: '[200] Lọc đơn thanh toán lỗi', method: 'GET', path: '/admin/orders', auth: 'staff', query: { status: 'PAYMENT_FAILED' }, status: 200, expect: [{ path: 'items.0.status', equals: 'PAYMENT_FAILED' }] },
    { name: '[200] Phân trang', method: 'GET', path: '/admin/orders', auth: 'staff', query: { pageSize: 5, page: 3 }, status: 200, expect: [{ path: 'page', equals: 3 }, { path: 'items', isArray: true, min: 5 }] },
    { name: '[400] Trạng thái lọc không hợp lệ', method: 'GET', path: '/admin/orders', auth: 'staff', query: { status: 'DONE' }, status: 400 },
    { name: '[403] Khách không xem được danh sách đơn quản trị', method: 'GET', path: '/admin/orders', auth: 'customer', status: 403 },
    { name: '[401] Danh sách đơn quản trị khi chưa đăng nhập', method: 'GET', path: '/admin/orders', status: 401 },
    { name: '[200] Chi tiết đơn đã giao: có khách, thanh toán, dòng món', method: 'GET', path: '/admin/orders/{{completedId}}', auth: 'staff', status: 200, expect: [{ path: 'customer.fullName', exists: true }, { path: 'payments', isArray: true, min: 1 }, { path: 'payments.0.status', equals: 'SUCCESS' }, { path: 'refunds', isArray: true }, { path: 'items', isArray: true, min: 1 }, { path: 'pickupCode', matches: '^\\d{6}$' }] },
    { name: '[200] Chi tiết đơn đã hủy cho thấy người hủy và lý do', method: 'GET', path: '/admin/orders/{{cancelledId}}', auth: 'manager', status: 200, expect: [{ path: 'cancelReason', exists: true }, { path: 'cancelledByUserId', exists: true }] },
    { name: '[200] Chi tiết đơn xong có mã nhận hàng', method: 'GET', path: '/admin/orders/{{readyId}}', auth: 'staff', status: 200, save: { pickupCode: 'pickupCode' }, expect: [{ path: 'pickupCode', matches: '^\\d{6}$' }] },
    { name: '[404] Chi tiết đơn không tồn tại', method: 'GET', path: '/admin/orders/999999', auth: 'staff', status: 404 },
    { name: '[400] id đơn không phải số', method: 'GET', path: '/admin/orders/abc', auth: 'staff', status: 400 },
    { name: '[403] Khách không xem được chi tiết đơn quản trị', method: 'GET', path: '/admin/orders/{{readyId}}', auth: 'customer', status: 403 },
    { name: '[200] Tra đơn theo mã nhận hàng', method: 'GET', path: '/admin/orders/by-pickup-code/{{pickupCode}}', auth: 'staff', status: 200, expect: [{ path: 'status', equals: 'READY' }] },
    { name: '[404] Mã nhận hàng không có đơn nào', method: 'GET', path: '/admin/orders/by-pickup-code/000000', auth: 'staff', status: 404 },
    { name: '[403] Khách không tra được theo mã nhận hàng', method: 'GET', path: '/admin/orders/by-pickup-code/{{pickupCode}}', auth: 'customer', status: 403 },

    // ───── Quản trị: đổi trạng thái (BR12) ─────
    { name: '[409] Đơn chưa thanh toán không sang được PREPARING', method: 'PATCH', path: '/admin/orders/{{orderId2}}/status', auth: 'staff', body: { status: 'PREPARING' }, status: 409 },
    { name: '[409] Đơn chưa thanh toán không nhảy được sang READY', method: 'PATCH', path: '/admin/orders/{{orderId2}}/status', auth: 'staff', body: { status: 'READY' }, status: 409 },
    { name: '[409] Không giao hàng bằng thao tác đổi trạng thái', method: 'PATCH', path: '/admin/orders/{{readyId}}/status', auth: 'staff', body: { status: 'COMPLETED' }, status: 409 },
    { name: '[409] Không hủy bằng thao tác đổi trạng thái', method: 'PATCH', path: '/admin/orders/{{orderId2}}/status', auth: 'staff', body: { status: 'CANCELLED' }, status: 409 },
    { name: '[409] Đơn đang pha không lùi lại được', method: 'PATCH', path: '/admin/orders/{{preparingId}}/status', auth: 'staff', body: { status: 'PREPARING' }, status: 409 },
    { name: '[409] Đơn đã xong không quay lại PREPARING', method: 'PATCH', path: '/admin/orders/{{readyId}}/status', auth: 'staff', body: { status: 'PREPARING' }, status: 409 },
    { name: '[409] Đơn đã giao không đổi trạng thái được', method: 'PATCH', path: '/admin/orders/{{completedId}}/status', auth: 'staff', body: { status: 'READY' }, status: 409 },
    { name: '[400] Trạng thái không thuộc danh sách', method: 'PATCH', path: '/admin/orders/{{orderId2}}/status', auth: 'staff', body: { status: 'DONE' }, status: 400 },
    { name: '[400] Thiếu trạng thái', method: 'PATCH', path: '/admin/orders/{{orderId2}}/status', auth: 'staff', body: {}, status: 400 },
    { name: '[404] Đổi trạng thái đơn không tồn tại', method: 'PATCH', path: '/admin/orders/999999/status', auth: 'staff', body: { status: 'PREPARING' }, status: 404 },
    { name: '[403] Khách không đổi được trạng thái đơn', method: 'PATCH', path: '/admin/orders/{{orderId2}}/status', auth: 'customer', body: { status: 'PREPARING' }, status: 403 },
    { name: '[401] Đổi trạng thái khi chưa đăng nhập', method: 'PATCH', path: '/admin/orders/{{orderId2}}/status', body: { status: 'PREPARING' }, status: 401 },

    // ───── Quản trị: giao món (UC35) ─────
    { name: '[400] Mã nhận hàng không đủ 6 số', method: 'POST', path: '/admin/orders/{{readyId}}/complete', auth: 'staff', body: { pickupCode: '12345' }, status: 400 },
    { name: '[400] Thiếu mã nhận hàng', method: 'POST', path: '/admin/orders/{{readyId}}/complete', auth: 'staff', body: {}, status: 400 },
    { name: '[422] Mã nhận hàng không khớp', method: 'POST', path: '/admin/orders/{{readyId}}/complete', auth: 'staff', body: { pickupCode: '000000' }, status: 422 },
    { name: '[409] Đơn chưa xong thì không giao được', method: 'POST', path: '/admin/orders/{{orderId2}}/complete', auth: 'staff', body: { pickupCode: '123456' }, status: 409 },
    { name: '[409] Đơn đã giao không giao lại được', method: 'POST', path: '/admin/orders/{{completedId}}/complete', auth: 'staff', body: { pickupCode: '123456' }, status: 409 },
    { name: '[404] Giao đơn không tồn tại', method: 'POST', path: '/admin/orders/999999/complete', auth: 'staff', body: { pickupCode: '123456' }, status: 404 },
    { name: '[403] Khách không giao được đơn', method: 'POST', path: '/admin/orders/{{readyId}}/complete', auth: 'customer', body: { pickupCode: '123456' }, status: 403 },

    // ───── Hủy đơn của khách (UC27) ─────
    { name: '[200] Khách hủy đơn chưa thanh toán, kèm lý do', method: 'POST', path: '/orders/{{orderId1}}/cancel', auth: 'ouser', body: { note: 'Mình đổi ý' }, status: 200, expect: [{ path: 'status', equals: 'CANCELLED' }, { path: 'cancelReason', equals: 'CUSTOMER_CANCEL' }, { path: 'cancelNote', equals: 'Mình đổi ý' }] },
    { name: '[409] Hủy lại đơn đã hủy', method: 'POST', path: '/orders/{{orderId1}}/cancel', auth: 'ouser', body: {}, status: 409 },
    { name: '[404] Hủy đơn của người khác', method: 'POST', path: '/orders/{{orderId2}}/cancel', auth: 'customer', body: {}, status: 404 },
    { name: '[404] Hủy đơn không tồn tại', method: 'POST', path: '/orders/999999/cancel', auth: 'ouser', body: {}, status: 404 },
    { name: '[400] Lý do hủy quá 200 ký tự', method: 'POST', path: '/orders/{{orderId2}}/cancel', auth: 'ouser', body: { note: 'a'.repeat(201) }, status: 400 },
    { name: '[401] Hủy đơn khi chưa đăng nhập', method: 'POST', path: '/orders/{{orderId2}}/cancel', body: {}, status: 401 },
    { name: '[403] Nhân viên không dùng được đường hủy của khách', method: 'POST', path: '/orders/{{orderId2}}/cancel', auth: 'staff', body: {}, status: 403 },

    // ───── Hủy đơn bởi nhân viên (UC36) ─────
    { name: '[400] Nhân viên hủy phải nhập lý do', method: 'POST', path: '/admin/orders/{{orderId2}}/cancel', auth: 'staff', body: {}, status: 400 },
    { name: '[400] Lý do dưới 5 ký tự', method: 'POST', path: '/admin/orders/{{orderId2}}/cancel', auth: 'staff', body: { note: 'ngắn' }, status: 400 },
    { name: '[400] Lý do quá 200 ký tự', method: 'POST', path: '/admin/orders/{{orderId2}}/cancel', auth: 'staff', body: { note: 'a'.repeat(201) }, status: 400 },
    { name: '[200] Nhân viên hủy đơn của khách, ghi người hủy và lý do', method: 'POST', path: '/admin/orders/{{orderId2}}/cancel', auth: 'staff', body: { note: 'Hết nguyên liệu không làm được' }, status: 200, expect: [{ path: 'status', equals: 'CANCELLED' }, { path: 'cancelReason', equals: 'STAFF_CANCEL' }, { path: 'cancelNote', equals: 'Hết nguyên liệu không làm được' }, { path: 'cancelledByUserId', exists: true }] },
    { name: '[409] Hủy lại đơn đã hủy', method: 'POST', path: '/admin/orders/{{orderId2}}/cancel', auth: 'staff', body: { note: 'Hủy lần hai' }, status: 409 },
    anyStaffCancel('[409] Không hủy được đơn đang pha', '{{preparingId}}', 409),
    anyStaffCancel('[409] Không hủy được đơn đã xong chờ nhận', '{{readyId}}', 409),
    anyStaffCancel('[409] Không hủy được đơn đã giao', '{{completedId}}', 409),
    anyStaffCancel('[404] Hủy đơn không tồn tại', '999999', 404),
    { name: '[403] Khách không dùng được đường hủy của quản trị', method: 'POST', path: '/admin/orders/{{orderId4}}/cancel', auth: 'customer', body: { note: 'Thử hủy bằng khách' }, status: 403 },

    // ───── Phản hồi: danh sách cho quản trị (UC37) ─────
    { name: '[200] Nhân viên xem phản hồi dịch vụ', method: 'GET', path: '/admin/feedback', auth: 'staff', status: 200, expect: [{ path: 'total', min: 100 }, { path: 'items.0.rating', min: 1 }, { path: 'items.0.orderCode', matches: '^BL' }, { path: 'items.0.customer.fullName', exists: true }] },
    { name: '[200] Lọc phản hồi theo số sao', method: 'GET', path: '/admin/feedback', auth: 'manager', query: { rating: 5 }, status: 200, expect: [{ path: 'items.0.rating', equals: 5 }] },
    { name: '[400] Số sao lọc ngoài 1-5', method: 'GET', path: '/admin/feedback', auth: 'staff', query: { rating: 6 }, status: 400 },
    { name: '[403] Khách không xem được phản hồi quản trị', method: 'GET', path: '/admin/feedback', auth: 'customer', status: 403 },
    { name: '[401] Phản hồi quản trị khi chưa đăng nhập', method: 'GET', path: '/admin/feedback', status: 401 },

    // ───── Dọn dẹp: hủy mọi đơn thử còn lại để trả số ly và lượt mã ─────
    { name: 'Dọn: hủy đơn dùng lại mã', method: 'POST', path: '/orders/{{orderId3b}}/cancel', auth: 'ouser', body: {}, status: 200 },
    { name: 'Dọn: hủy đơn tặng ly', method: 'POST', path: '/orders/{{orderId4}}/cancel', auth: 'ouser', body: {}, status: 200 },
    { name: 'Dọn: khóa món thử tồn kho', method: 'PATCH', path: '/admin/products/{{stockProductId}}/lock', auth: 'manager', body: { isLocked: true }, status: 200 },
  ],
};
export default folder;
