import { Case, Folder } from '../lib/dsl';

const line = (over: Record<string, unknown> = {}) => ({ productId: 1, sizeCode: 'M', iceLevel: 50, sugarLevel: 70, temperature: 'COLD', quantity: 1, ...over });

const user = (tag: string, name: string): Case[] => [
  { name: `Tạo khách ${name}: đăng ký`, method: 'POST', path: '/auth/register', set: { [`phone_${tag}`]: 'phone' }, body: { phone: `{{phone_${tag}}}`, password: 'Matkhau123', fullName: `Khách ${name}` }, status: 201 },
  { name: `Tạo khách ${name}: xác thực OTP`, method: 'POST', path: '/auth/verify-otp', body: { phone: `{{phone_${tag}}}`, code: '123456' }, status: 200, save: { [`${tag}Token`]: 'token' } },
];

// Tạo đơn rồi trả bằng ví điện tử, lưu id đơn và id dòng đầu tiên
const paidOrder = (tag: string, auth: string, items: unknown[], extra: Record<string, unknown> = {}): Case[] => [
  { name: `Tạo đơn ${tag}`, method: 'POST', path: '/orders', auth, body: { items, ...extra }, status: 201, save: { [`order${tag}`]: 'id', [`item${tag}`]: 'items.0.id' } },
  { name: `Sinh khóa thanh toán đơn ${tag}`, method: 'GET', path: '/health', set: { [`key${tag}`]: 'uuid' }, status: 200 },
  { name: `Thanh toán đơn ${tag}`, method: 'POST', path: '/payments', auth, headers: { 'Idempotency-Key': `{{key${tag}}}` }, body: { orderId: `@order${tag}`, method: 'EWALLET' }, status: 201, expect: [{ path: 'order.status', equals: 'PAID' }] },
];

const issue = (name: string, order: string, body: Record<string, unknown>, status: number, extra: Partial<Case> = {}): Case => ({
  name, method: 'POST', path: `/admin/orders/{{${order}}}/item-issues`, auth: 'staff', body, status, ...extra,
});

const folder: Folder = {
  name: '10 · Món không làm được (item-issues)',
  description: 'UC74: nhân viên hoàn tiền món vào ví hoặc đổi món; quản lý xem lại danh sách xử lý.',
  cases: [
    ...user('iu', 'Món Thiếu'),
    ...paidOrder('G', 'iu', [line({ quantity: 2 })]),
    { name: 'Tạo đơn H chưa thanh toán', method: 'POST', path: '/orders', auth: 'iu', body: { items: [line()] }, status: 201, save: { orderH: 'id', itemH: 'items.0.id' } },

    // ───── Hoàn tiền món vào ví ─────
    issue('[201] Hoàn tiền 1 trong 2 ly vào ví', 'orderG', { orderItemId: '@itemG', quantity: 1, resolution: 'REFUND_TO_WALLET', note: 'Hết sữa tươi không pha được' }, 201, {
      expect: [{ path: 'resolution', equals: 'REFUND_TO_WALLET' }, { path: 'refundAmount', equals: 32000 }, { path: 'refundId', exists: true }, { path: 'remainingQuantity', equals: 1 }],
    }),
    { name: '[200] Tiền được cộng vào ví của khách', method: 'GET', path: '/wallet', auth: 'iu', status: 200, expect: [{ path: 'balance', equals: 32000 }, { path: 'transactions.0.type', equals: 'REFUND_IN' }, { path: 'transactions.0.amount', equals: 32000 }] },
    { name: '[200] Đơn vẫn PAID, khoản hoàn ghi lý do MISSING_ITEM', method: 'GET', path: '/admin/orders/{{orderG}}', auth: 'staff', status: 200, expect: [{ path: 'status', equals: 'PAID' }, { path: 'refunds.0.reason', equals: 'MISSING_ITEM' }, { path: 'refunds.0.amount', equals: 32000 }] },
    { name: '[200] Điểm tích lũy không đổi (BR51)', method: 'GET', path: '/users/me/points', auth: 'iu', status: 200, expect: [{ path: 'points', equals: 60 }, { path: 'totalCups', equals: 2 }] },

    // ───── Đổi món khác ngoài quầy ─────
    issue('[201] Ghi nhận đổi món cho ly còn lại, không hoàn tiền', 'orderG', { orderItemId: '@itemG', quantity: 1, resolution: 'EXCHANGE', note: 'Khách đổi sang trà đào cam sả' }, 201, {
      expect: [{ path: 'resolution', equals: 'EXCHANGE' }, { path: 'refundId', equals: null }, { path: 'refundAmount', equals: null }, { path: 'remainingQuantity', equals: 0 }],
    }),
    { name: '[200] Đổi món không làm ví thay đổi', method: 'GET', path: '/wallet', auth: 'iu', status: 200, expect: [{ path: 'balance', equals: 32000 }] },
    issue('[422] Dòng đã xử lý hết, không còn ly nào để xử lý', 'orderG', { orderItemId: '@itemG', quantity: 1, resolution: 'EXCHANGE', note: 'Thử xử lý thêm' }, 422),

    // ───── Dữ liệu sai ─────
    issue('[400] Lý do dưới 5 ký tự', 'orderG', { orderItemId: '@itemG', quantity: 1, resolution: 'EXCHANGE', note: 'ngắn' }, 400),
    issue('[400] Thiếu lý do', 'orderG', { orderItemId: '@itemG', quantity: 1, resolution: 'EXCHANGE' }, 400),
    issue('[400] Lý do quá 200 ký tự', 'orderG', { orderItemId: '@itemG', quantity: 1, resolution: 'EXCHANGE', note: 'a'.repeat(201) }, 400),
    issue('[400] Cách xử lý không hợp lệ', 'orderG', { orderItemId: '@itemG', quantity: 1, resolution: 'GIVE_FREE', note: 'Tặng luôn cho khách' }, 400),
    issue('[400] Số ly không phải số nguyên', 'orderG', { orderItemId: '@itemG', quantity: 'một', resolution: 'EXCHANGE', note: 'Số ly sai kiểu' }, 400),
    issue('[400] Thiếu orderItemId', 'orderG', { quantity: 1, resolution: 'EXCHANGE', note: 'Thiếu dòng món' }, 400),
    issue('[422] Số ly bằng 0', 'orderG', { orderItemId: '@itemG', quantity: 0, resolution: 'EXCHANGE', note: 'Số ly bằng không' }, 422),
    issue('[422] Số ly âm', 'orderG', { orderItemId: '@itemG', quantity: -1, resolution: 'EXCHANGE', note: 'Số ly âm thử' }, 422),
    issue('[422] Dòng món thuộc đơn khác', 'orderG', { orderItemId: '@itemH', quantity: 1, resolution: 'EXCHANGE', note: 'Nhầm dòng của đơn khác' }, 422),
    issue('[409] Đơn chưa thanh toán không xử lý món được', 'orderH', { orderItemId: '@itemH', quantity: 1, resolution: 'REFUND_TO_WALLET', note: 'Đơn chưa trả tiền' }, 409),
    issue('[404] Đơn không tồn tại', 'orderG', { orderItemId: '@itemG', quantity: 1, resolution: 'EXCHANGE', note: 'Đơn không tồn tại' }, 404, { path: '/admin/orders/999999/item-issues' }),
    { name: '[400] id đơn không phải số', method: 'POST', path: '/admin/orders/abc/item-issues', auth: 'staff', body: { orderItemId: 1, quantity: 1, resolution: 'EXCHANGE', note: 'id đơn sai kiểu' }, status: 400 },
    { name: '[403] Khách không xử lý món được', method: 'POST', path: '/admin/orders/{{orderG}}/item-issues', auth: 'iu', body: { orderItemId: '@itemG', quantity: 1, resolution: 'EXCHANGE', note: 'Khách tự xử lý' }, status: 403 },
    { name: '[401] Xử lý món khi chưa đăng nhập', method: 'POST', path: '/admin/orders/{{orderG}}/item-issues', body: { orderItemId: '@itemG', quantity: 1, resolution: 'EXCHANGE', note: 'Chưa đăng nhập' }, status: 401 },

    // ───── Đơn đã giao hoặc đã hủy thì không xử lý (409) ─────
    { name: 'Lấy một đơn đã giao', method: 'GET', path: '/admin/orders', auth: 'staff', query: { status: 'COMPLETED', pageSize: 1 }, status: 200, save: { doneOrder: 'items.0.id' } },
    { name: 'Lấy dòng món của đơn đã giao', method: 'GET', path: '/admin/orders/{{doneOrder}}', auth: 'staff', status: 200, save: { doneItem: 'items.0.id' } },
    issue('[409] Đơn đã giao', 'doneOrder', { orderItemId: '@doneItem', quantity: 1, resolution: 'EXCHANGE', note: 'Đơn đã giao rồi' }, 409),
    { name: 'Lấy một đơn đã hủy', method: 'GET', path: '/admin/orders', auth: 'staff', query: { status: 'CANCELLED', pageSize: 1 }, status: 200, save: { cancelledOrder: 'items.0.id' } },
    { name: 'Lấy dòng món của đơn đã hủy', method: 'GET', path: '/admin/orders/{{cancelledOrder}}', auth: 'staff', status: 200, save: { cancelledItem: 'items.0.id' } },
    issue('[409] Đơn đã hủy', 'cancelledOrder', { orderItemId: '@cancelledItem', quantity: 1, resolution: 'EXCHANGE', note: 'Đơn đã hủy rồi' }, 409),

    // ───── Tổng hoàn không vượt tổng khách đã trả (BR45), hủy đơn chỉ hoàn phần còn lại ─────
    ...user('ik', 'Hoàn Một Phần'),
    ...paidOrder('K', 'ik', [line({ quantity: 2 })], { promotionCode: 'WELCOME10' }),
    { name: '[200] Đơn K đã giảm giá: khách chỉ trả 57.600đ', method: 'GET', path: '/orders/{{orderK}}', auth: 'ik', status: 200, expect: [{ path: 'totalAmount', equals: 57600 }] },
    { name: '[200] Nhân viên chuyển đơn K sang đang pha', method: 'PATCH', path: '/admin/orders/{{orderK}}/status', auth: 'staff', body: { status: 'PREPARING' }, status: 200 },
    issue('[201] Vẫn xử lý được khi đơn đang pha: hoàn 1 ly (32.000đ)', 'orderK', { orderItemId: '@itemK', quantity: 1, resolution: 'REFUND_TO_WALLET', note: 'Hết ly nhựa size M' }, 201, { expect: [{ path: 'refundAmount', equals: 32000 }] }),
    issue('[422] Hoàn thêm ly nữa sẽ vượt tổng đã trả (64.000đ > 57.600đ)', 'orderK', { orderItemId: '@itemK', quantity: 1, resolution: 'REFUND_TO_WALLET', note: 'Hoàn nốt ly còn lại' }, 422),
    issue('[201] Nhưng ghi nhận đổi món cho ly còn lại thì được', 'orderK', { orderItemId: '@itemK', quantity: 1, resolution: 'EXCHANGE', note: 'Đổi sang món khác' }, 201),
    { name: '[409] Đơn đang pha thì khách không hủy được', method: 'POST', path: '/orders/{{orderK}}/cancel', auth: 'ik', body: {}, status: 409 },

    // Đơn thứ hai để thử hủy sau khi đã hoàn một phần
    ...paidOrder('L', 'ik', [line({ quantity: 2 })]),
    issue('Hoàn 1 ly của đơn L (32.000đ)', 'orderL', { orderItemId: '@itemL', quantity: 1, resolution: 'REFUND_TO_WALLET', note: 'Hết nguyên liệu một ly' }, 201),
    { name: '[200] Khách hủy đơn L: chỉ hoàn phần còn lại 32.000đ', method: 'POST', path: '/orders/{{orderL}}/cancel', auth: 'ik', body: { note: 'Không cần nữa' }, status: 200 },
    { name: '[200] Đơn L có hai khoản hoàn, tổng đúng bằng số đã trả', method: 'GET', path: '/admin/orders/{{orderL}}', auth: 'manager', status: 200, expect: [{ path: 'refunds.0.reason', equals: 'MISSING_ITEM' }, { path: 'refunds.0.amount', equals: 32000 }, { path: 'refunds.1.reason', equals: 'CANCEL' }, { path: 'refunds.1.amount', equals: 32000 }, { path: 'refunds.2', exists: false }] },
    { name: '[200] Ví của khách đúng tổng hai khoản hoàn của đơn L (64.000đ) cộng khoản của đơn K (32.000đ)', method: 'GET', path: '/wallet', auth: 'ik', status: 200, expect: [{ path: 'balance', equals: 96000 }] },

    // ───── Quản lý xem lại danh sách xử lý ─────
    { name: '[200] Quản lý xem danh sách món không làm được', method: 'GET', path: '/admin/item-issues', auth: 'manager', status: 200, expect: [{ path: 'total', min: 14 }, { path: 'items.0.orderCode', matches: '^BL' }, { path: 'items.0.productName', exists: true }, { path: 'items.0.handledBy.fullName', exists: true }, { path: 'items.0.note', exists: true }] },
    { name: '[200] Lọc theo đổi món', method: 'GET', path: '/admin/item-issues', auth: 'manager', query: { resolution: 'EXCHANGE' }, status: 200, expect: [{ path: 'items.0.resolution', equals: 'EXCHANGE' }, { path: 'items.0.refundAmount', equals: null }] },
    { name: '[200] Lọc theo hoàn tiền vào ví', method: 'GET', path: '/admin/item-issues', auth: 'manager', query: { resolution: 'REFUND_TO_WALLET' }, status: 200, expect: [{ path: 'items.0.resolution', equals: 'REFUND_TO_WALLET' }, { path: 'items.0.refundAmount', min: 1 }] },
    { name: '[200] Lọc theo khoảng ngày có dữ liệu', method: 'GET', path: '/admin/item-issues', auth: 'manager', query: { from: '2020-01-01T00:00:00.000Z', to: '2100-01-01T00:00:00.000Z' }, status: 200, expect: [{ path: 'total', min: 14 }] },
    { name: '[200] Khoảng ngày trong tương lai không có gì', method: 'GET', path: '/admin/item-issues', auth: 'manager', query: { from: '2100-01-01T00:00:00.000Z' }, status: 200, expect: [{ path: 'total', equals: 0 }, { path: 'items', equals: [] }] },
    { name: '[400] Ngày bắt đầu sau ngày kết thúc', method: 'GET', path: '/admin/item-issues', auth: 'manager', query: { from: '2026-12-01T00:00:00.000Z', to: '2026-01-01T00:00:00.000Z' }, status: 400 },
    { name: '[400] Ngày không đúng định dạng', method: 'GET', path: '/admin/item-issues', auth: 'manager', query: { from: 'hôm qua' }, status: 400 },
    { name: '[400] Cách xử lý lọc không hợp lệ', method: 'GET', path: '/admin/item-issues', auth: 'manager', query: { resolution: 'GIVE_FREE' }, status: 400 },
    { name: '[403] Nhân viên không xem được danh sách xử lý (chỉ quản lý)', method: 'GET', path: '/admin/item-issues', auth: 'staff', status: 403 },
    { name: '[401] Danh sách xử lý khi chưa đăng nhập', method: 'GET', path: '/admin/item-issues', status: 401 },

    // ───── Dọn dẹp: đưa các đơn còn PAID về trạng thái đã hủy ─────
    { name: 'Dọn: đơn K báo xong', method: 'PATCH', path: '/admin/orders/{{orderK}}/status', auth: 'staff', body: { status: 'READY' }, status: 200, save: { pickupK: 'pickupCode' } },
    { name: 'Dọn: đơn K giao cho khách', method: 'POST', path: '/admin/orders/{{orderK}}/complete', auth: 'staff', body: { pickupCode: '{{pickupK}}' }, status: 200 },
    { name: 'Dọn: nhân viên hủy đơn G', method: 'POST', path: '/admin/orders/{{orderG}}/cancel', auth: 'staff', body: { note: 'Dọn dữ liệu thử nghiệm' }, status: 200 },
  ],
};
export default folder;
