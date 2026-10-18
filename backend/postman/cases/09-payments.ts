import { Case, Folder } from '../lib/dsl';

const line = (over: Record<string, unknown> = {}) => ({ productId: 1, sizeCode: 'M', iceLevel: 50, sugarLevel: 70, temperature: 'COLD', quantity: 1, ...over });
const GOOD_CARD = { number: '4111 1111 1111 1111', holderName: 'NGUYEN VAN A', expiry: '12/39', cvv: '123' };
const BAD_CARD = { number: '4000 0000 0000 0002', holderName: 'NGUYEN VAN A', expiry: '12/39', cvv: '123' };

const user = (tag: string, name: string): Case[] => [
  { name: `Tạo khách ${name}: đăng ký`, method: 'POST', path: '/auth/register', set: { [`phone_${tag}`]: 'phone' }, body: { phone: `{{phone_${tag}}}`, password: 'Matkhau123', fullName: `Khách ${name}` }, status: 201 },
  { name: `Tạo khách ${name}: xác thực OTP`, method: 'POST', path: '/auth/verify-otp', body: { phone: `{{phone_${tag}}}`, code: '123456' }, status: 200, save: { [`${tag}Token`]: 'token' } },
];

const newOrder = (name: string, auth: string, orderVar: string, items: unknown[], extra: Record<string, unknown> = {}): Case => ({
  name, method: 'POST', path: '/orders', auth, body: { items, ...extra }, status: 201, save: { [orderVar]: 'id', [`${orderVar}Code`]: 'orderCode' },
});

const pay = (name: string, auth: string, orderVar: string, keyVar: string, status: number, body: Record<string, unknown> = {}, extra: Partial<Case> = {}): Case => ({
  name, method: 'POST', path: '/payments', auth, headers: { 'Idempotency-Key': `{{${keyVar}}}` }, body: { orderId: `@${orderVar}`, method: 'EWALLET', ...body }, status, ...extra,
});

const folder: Folder = {
  name: '09 · Thanh toán và vòng đời đơn (payments)',
  description: 'UC21-UC23 thanh toán giả lập (ví, thẻ, chuyển khoản), BR10 idempotency, BR11 điểm, BR38 hóa đơn, UC34-35 pha và giao, UC28 đánh giá, UC27/36 hủy đơn đã trả tiền.',
  cases: [
    ...user('pay', 'Thanh Toán'),
    newOrder('Đơn A: 2 ly cà phê sữa đá (64.000đ)', 'pay', 'orderA', [line({ quantity: 2 })]),
    newOrder('Đơn B: 1 ly (32.000đ)', 'pay', 'orderB', [line()]),

    // ───── Dữ liệu gửi lên sai (400) ─────
    { name: '[400] Thiếu header Idempotency-Key', method: 'POST', path: '/payments', auth: 'pay', body: { orderId: '@orderA', method: 'EWALLET' }, status: 400 },
    { name: '[400] Idempotency-Key quá 100 ký tự', method: 'POST', path: '/payments', auth: 'pay', headers: { 'Idempotency-Key': 'k'.repeat(101) }, body: { orderId: '@orderA', method: 'EWALLET' }, status: 400 },
    { name: 'Sinh khóa cho nhóm test lỗi', method: 'GET', path: '/health', set: { kBad: 'uuid' }, status: 200 },
    pay('[400] Thiếu orderId', 'pay', 'orderA', 'kBad', 400, { orderId: undefined }),
    pay('[400] orderId không phải số', 'pay', 'orderA', 'kBad', 400, { orderId: 'abc' }),
    pay('[400] Phương thức không hợp lệ', 'pay', 'orderA', 'kBad', 400, { method: 'BITCOIN' }),
    pay('[400] Trả bằng thẻ nhưng thiếu thông tin thẻ', 'pay', 'orderA', 'kBad', 400, { method: 'CARD' }),
    pay('[400] Số thẻ 15 chữ số', 'pay', 'orderA', 'kBad', 400, { method: 'CARD', card: { ...GOOD_CARD, number: '411111111111111' } }),
    pay('[400] Số thẻ có chữ', 'pay', 'orderA', 'kBad', 400, { method: 'CARD', card: { ...GOOD_CARD, number: '4111abcd11111111' } }),
    pay('[400] CVV chỉ 2 chữ số', 'pay', 'orderA', 'kBad', 400, { method: 'CARD', card: { ...GOOD_CARD, cvv: '12' } }),
    pay('[400] Hạn thẻ tháng 13', 'pay', 'orderA', 'kBad', 400, { method: 'CARD', card: { ...GOOD_CARD, expiry: '13/30' } }),
    pay('[400] Hạn thẻ sai định dạng', 'pay', 'orderA', 'kBad', 400, { method: 'CARD', card: { ...GOOD_CARD, expiry: '1/30' } }),
    pay('[400] Thẻ đã hết hạn', 'pay', 'orderA', 'kBad', 400, { method: 'CARD', card: { ...GOOD_CARD, expiry: '01/20' } }),
    pay('[400] Tên chủ thẻ có dấu hoặc số', 'pay', 'orderA', 'kBad', 400, { method: 'CARD', card: { ...GOOD_CARD, holderName: 'Nguyễn 123' } }),
    pay('[404] Đơn không tồn tại', 'pay', 'orderA', 'kBad', 404, { orderId: 999999 }),
    pay('[404] Thanh toán đơn của người khác', 'customer', 'orderA', 'kBad', 404),
    pay('[401] Thanh toán khi chưa đăng nhập', '', 'orderA', 'kBad', 401, {}, { auth: undefined }),
    pay('[403] Nhân viên không thanh toán được', 'staff', 'orderA', 'kBad', 403),

    // ───── Ví điện tử, idempotency (BR10) ─────
    { name: 'Sinh khóa kA', method: 'GET', path: '/health', set: { kA: 'uuid', kA2: 'uuid' }, status: 200 },
    pay('[201] Thanh toán đơn A bằng ví điện tử', 'pay', 'orderA', 'kA', 201, {}, {
      save: { payA: 'payment.id' },
      expect: [{ path: 'payment.status', equals: 'SUCCESS' }, { path: 'payment.method', equals: 'EWALLET' }, { path: 'payment.amount', equals: 64000 }, { path: 'payment.gatewayRef', matches: '^MOCK-EW' }, { path: 'payment.idempotencyKey', exists: false }, { path: 'order.status', equals: 'PAID' }, { path: 'order.pointsAwarded', equals: 60 }],
    }),
    pay('[201] Gửi lại cùng Idempotency-Key: trả kết quả cũ, không trừ tiền lần nữa', 'pay', 'orderA', 'kA', 201, {}, { expect: [{ path: 'payment.id', sameAs: 'payA' }, { path: 'order.status', equals: 'PAID' }, { path: 'order.pointsAwarded', equals: 60 }] }),
    { name: '[200] Đơn chỉ có đúng một lần thanh toán', method: 'GET', path: '/orders/{{orderA}}', auth: 'pay', status: 200, expect: [{ path: 'payments.0.id', sameAs: 'payA' }, { path: 'payments.1', exists: false }, { path: 'status', equals: 'PAID' }] },
    pay('[409] Cùng khóa nhưng cho đơn khác', 'pay', 'orderB', 'kA', 409),
    newOrder('Khách khác tạo đơn để thử trùng khóa', 'customer', 'orderOther', [line()]),
    pay('[409] Cùng khóa nhưng của khách khác', 'customer', 'orderOther', 'kA', 409),
    { name: 'Dọn: khách khác hủy đơn thử', method: 'POST', path: '/orders/{{orderOther}}/cancel', auth: 'customer', body: {}, status: 200 },
    pay('[409] Đơn đã thanh toán không trả tiền lần nữa (khóa mới)', 'pay', 'orderA', 'kA2', 409),
    { name: '[200] Điểm và số ly được cộng sau khi thanh toán', method: 'GET', path: '/users/me/points', auth: 'pay', status: 200, expect: [{ path: 'points', equals: 60 }, { path: 'totalCups', equals: 2 }] },
    { name: '[200] Nhân viên thấy giao dịch trong chi tiết đơn', method: 'GET', path: '/admin/orders/{{orderA}}', auth: 'staff', status: 200, expect: [{ path: 'payments.0.method', equals: 'EWALLET' }, { path: 'payments.0.status', equals: 'SUCCESS' }, { path: 'refunds', equals: [] }] },

    // ───── Hóa đơn (BR38) ─────
    { name: '[200] Hóa đơn đơn đã trả tiền', method: 'GET', path: '/orders/{{orderA}}/bill', auth: 'pay', status: 200, expect: [{ path: 'orderCode', sameAs: 'orderACode' }, { path: 'lines.0.quantity', equals: 2 }, { path: 'lines.0.sizeLabel', equals: 'M · 460 ml' }, { path: 'lines.0.lineTotal', equals: 64000 }, { path: 'phoneMasked', matches: '^098\\*{4}\\d{3}$' }, { path: 'paymentMethod', equals: 'EWALLET' }, { path: 'transactionCode', matches: '^MOCK-EW' }, { path: 'totalAmount', equals: 64000 }, { path: 'pointsEarned', equals: 60 }, { path: 'refundAmounts', equals: [] }, { path: 'netAmount', equals: 64000 }, { path: 'isCancelled', equals: false }] },

    // ───── Thẻ: thất bại rồi thử lại (UC23) ─────
    { name: 'Sinh khóa cho thẻ', method: 'GET', path: '/health', set: { kB1: 'uuid', kB2: 'uuid', kC: 'uuid' }, status: 200 },
    pay('[201] Thẻ bị từ chối: thanh toán thất bại', 'pay', 'orderB', 'kB1', 201, { method: 'CARD', card: BAD_CARD }, { expect: [{ path: 'payment.status', equals: 'FAILED' }, { path: 'payment.cardLast4', equals: '0002' }, { path: 'order.status', equals: 'PAYMENT_FAILED' }, { path: 'order.pointsAwarded', equals: 0 }, { path: 'payment.number', exists: false }] }),
    { name: '[409] Đơn thanh toán lỗi chưa có hóa đơn', method: 'GET', path: '/orders/{{orderB}}/bill', auth: 'pay', status: 409 },
    pay('[201] Thử lại bằng thẻ khác, khóa mới: thành công', 'pay', 'orderB', 'kB2', 201, { method: 'CARD', card: GOOD_CARD }, { expect: [{ path: 'payment.status', equals: 'SUCCESS' }, { path: 'payment.cardLast4', equals: '1111' }, { path: 'order.status', equals: 'PAID' }, { path: 'order.payments.1.status', equals: 'SUCCESS' }, { path: 'order.payments.0.status', equals: 'FAILED' }] }),

    // ───── Chuyển khoản ─────
    newOrder('Đơn C để thử chuyển khoản', 'pay', 'orderC', [line()]),
    pay('[201] Chuyển khoản: có mã tham chiếu và hạn 10 phút', 'pay', 'orderC', 'kC', 201, { method: 'TRANSFER' }, { expect: [{ path: 'payment.status', equals: 'SUCCESS' }, { path: 'payment.transferRef', matches: '^BL\\d{10}$' }, { path: 'payment.expiresAt', exists: true }, { path: 'payment.gatewayRef', matches: '^MOCK-TF' }, { path: 'order.status', equals: 'PAID' }] }),

    // ───── Điểm tính trên số tiền đã trả sau giảm giá (BR11) ─────
    { name: 'Sinh khóa cho đơn giảm giá', method: 'GET', path: '/health', set: { kD: 'uuid' }, status: 200 },
    newOrder('Đơn D dùng mã WELCOME10 (57.600đ)', 'pay', 'orderD', [line({ quantity: 2 })], { promotionCode: 'WELCOME10' }),
    pay('[201] Điểm = 50 vì tính trên 57.600đ, làm tròn xuống theo bước', 'pay', 'orderD', 'kD', 201, {}, { expect: [{ path: 'order.totalAmount', equals: 57600 }, { path: 'order.pointsAwarded', equals: 50 }] }),
    { name: '[200] Hóa đơn ghi rõ mã và nhãn giảm giá', method: 'GET', path: '/orders/{{orderD}}/bill', auth: 'pay', status: 200, expect: [{ path: 'promotionCode', equals: 'WELCOME10' }, { path: 'promotionLabel', matches: '^Giảm 10%' }, { path: 'discountAmount', equals: 6400 }, { path: 'subtotal', equals: 64000 }] },

    // ───── Nhân viên pha và giao (UC34, UC35), khách đánh giá (UC28) ─────
    { name: '[200] Nhân viên chuyển sang đang pha', method: 'PATCH', path: '/admin/orders/{{orderA}}/status', auth: 'staff', body: { status: 'PREPARING' }, status: 200, expect: [{ path: 'status', equals: 'PREPARING' }, { path: 'pickupCode', equals: null }] },
    { name: '[409] Đơn đang pha thì khách không hủy được', method: 'POST', path: '/orders/{{orderA}}/cancel', auth: 'pay', body: {}, status: 409 },
    { name: '[409] Nhân viên cũng không hủy được đơn đang pha', method: 'POST', path: '/admin/orders/{{orderA}}/cancel', auth: 'staff', body: { note: 'Thử hủy khi đang pha' }, status: 409 },
    { name: '[200] Nhân viên báo đã xong, hệ thống sinh mã nhận hàng', method: 'PATCH', path: '/admin/orders/{{orderA}}/status', auth: 'manager', body: { status: 'READY' }, status: 200, save: { pickupA: 'pickupCode' }, expect: [{ path: 'status', equals: 'READY' }, { path: 'pickupCode', matches: '^\\d{6}$' }] },
    { name: '[200] Khách thấy mã nhận hàng khi đơn xong', method: 'GET', path: '/orders/{{orderA}}', auth: 'pay', status: 200, expect: [{ path: 'status', equals: 'READY' }, { path: 'pickupCode', sameAs: 'pickupA' }] },
    { name: '[200] Nhân viên tra đơn theo mã nhận hàng', method: 'GET', path: '/admin/orders/by-pickup-code/{{pickupA}}', auth: 'staff', status: 200, expect: [{ path: 'id', sameAs: 'orderA' }] },
    { name: '[422] Nhập sai mã nhận hàng', method: 'POST', path: '/admin/orders/{{orderA}}/complete', auth: 'staff', body: { pickupCode: '000000' }, status: 422 },
    { name: '[200] Nhập đúng mã: giao thành công', method: 'POST', path: '/admin/orders/{{orderA}}/complete', auth: 'staff', body: { pickupCode: '{{pickupA}}' }, status: 200, expect: [{ path: 'status', equals: 'COMPLETED' }] },
    { name: '[200] Sau khi giao, khách không còn thấy mã nhận hàng', method: 'GET', path: '/orders/{{orderA}}', auth: 'pay', status: 200, expect: [{ path: 'status', equals: 'COMPLETED' }, { path: 'pickupCode', equals: null }] },
    { name: '[409] Đơn đã giao không giao lại được', method: 'POST', path: '/admin/orders/{{orderA}}/complete', auth: 'staff', body: { pickupCode: '{{pickupA}}' }, status: 409 },
    { name: '[409] Đơn đã giao không hủy được', method: 'POST', path: '/orders/{{orderA}}/cancel', auth: 'pay', body: {}, status: 409 },
    { name: '[201] Khách đánh giá đơn đã nhận', method: 'POST', path: '/orders/{{orderA}}/feedback', auth: 'pay', body: { rating: 5, comment: 'Đồ uống ngon, lên món nhanh' }, status: 201, expect: [{ path: 'rating', equals: 5 }] },
    { name: '[409] Mỗi đơn chỉ đánh giá một lần', method: 'POST', path: '/orders/{{orderA}}/feedback', auth: 'pay', body: { rating: 1 }, status: 409 },
    { name: '[200] Phản hồi hiện trong chi tiết đơn', method: 'GET', path: '/orders/{{orderA}}', auth: 'pay', status: 200, expect: [{ path: 'feedback.rating', equals: 5 }, { path: 'feedback.comment', equals: 'Đồ uống ngon, lên món nhanh' }] },
    { name: '[200] Phản hồi mới nhất hiện đầu danh sách quản trị', method: 'GET', path: '/admin/feedback', auth: 'staff', status: 200, expect: [{ path: 'items.0.orderCode', sameAs: 'orderACode' }, { path: 'items.0.rating', equals: 5 }] },

    // ───── Hủy đơn đã trả tiền: hoàn vào ví, thu hồi điểm (BR13, BR16, BR43, BR51) ─────
    ...user('cu', 'Hủy Đơn'),
    { name: 'Sinh khóa cho nhóm hủy đơn', method: 'GET', path: '/health', set: { kE: 'uuid', kF: 'uuid' }, status: 200 },
    newOrder('Đơn E: 1 ly (32.000đ)', 'cu', 'orderE', [line()]),
    pay('Thanh toán đơn E', 'cu', 'orderE', 'kE', 201, {}, { expect: [{ path: 'order.pointsAwarded', equals: 30 }] }),
    { name: '[200] Có 30 điểm và 1 ly', method: 'GET', path: '/users/me/points', auth: 'cu', status: 200, expect: [{ path: 'points', equals: 30 }, { path: 'totalCups', equals: 1 }] },
    { name: '[200] Khách hủy đơn đã trả tiền', method: 'POST', path: '/orders/{{orderE}}/cancel', auth: 'cu', body: { note: 'Đổi ý không uống nữa' }, status: 200, expect: [{ path: 'status', equals: 'CANCELLED' }, { path: 'cancelReason', equals: 'CUSTOMER_CANCEL' }] },
    { name: '[200] Điểm và số ly bị thu hồi đúng bằng lúc cộng', method: 'GET', path: '/users/me/points', auth: 'cu', status: 200, expect: [{ path: 'points', equals: 0 }, { path: 'totalCups', equals: 0 }] },
    { name: '[200] Tiền hoàn đủ vào ví', method: 'GET', path: '/wallet', auth: 'cu', status: 200, expect: [{ path: 'balance', equals: 32000 }, { path: 'transactions.0.type', equals: 'REFUND_IN' }, { path: 'transactions.0.amount', equals: 32000 }] },
    { name: '[200] Chi tiết đơn ghi khoản hoàn tiền', method: 'GET', path: '/admin/orders/{{orderE}}', auth: 'manager', status: 200, expect: [{ path: 'refunds.0.amount', equals: 32000 }, { path: 'refunds.0.reason', equals: 'CANCEL' }, { path: 'status', equals: 'CANCELLED' }] },
    { name: '[200] Hóa đơn đơn đã hủy: đánh dấu hủy và trừ khoản hoàn', method: 'GET', path: '/orders/{{orderE}}/bill', auth: 'cu', status: 200, expect: [{ path: 'isCancelled', equals: true }, { path: 'refundAmounts', equals: [32000] }, { path: 'netAmount', equals: 0 }] },
    newOrder('Đơn F: 1 ly (32.000đ) để nhân viên hủy', 'cu', 'orderF', [line()]),
    pay('Thanh toán đơn F', 'cu', 'orderF', 'kF', 201),
    { name: '[200] Nhân viên hủy đơn đã trả tiền của khách', method: 'POST', path: '/admin/orders/{{orderF}}/cancel', auth: 'staff', body: { note: 'Hết nguyên liệu pha món này' }, status: 200, expect: [{ path: 'cancelReason', equals: 'STAFF_CANCEL' }, { path: 'refunds.0.amount', equals: 32000 }] },
    { name: '[200] Ví của khách tăng thêm khoản hoàn thứ hai', method: 'GET', path: '/wallet', auth: 'cu', status: 200, expect: [{ path: 'balance', equals: 64000 }, { path: 'transactions', min: 2 }] },

    // ───── Tích đủ 10 ly: tự cấp mã thưởng, hủy đơn không thu hồi mã (BR40, BR51) ─────
    ...user('ru', 'Thưởng'),
    { name: 'Sinh khóa cho đơn thưởng', method: 'GET', path: '/health', set: { kR: 'uuid' }, status: 200 },
    newOrder('Đơn R: 10 bánh quy (250.000đ)', 'ru', 'orderR', [line({ productId: 34, iceLevel: 0, sugarLevel: 0, quantity: 10 })]),
    pay('Thanh toán đơn R', 'ru', 'orderR', 'kR', 201, {}, { expect: [{ path: 'order.totalAmount', equals: 250000 }, { path: 'order.pointsAwarded', equals: 250 }] }),
    { name: '[200] Đủ 10 ly: nhận được 1 mã tặng ly riêng', method: 'GET', path: '/promotions/mine', auth: 'ru', status: 200, expect: [{ path: '0.scope', equals: 'PERSONAL' }, { path: '0.label', matches: '^Tặng 1 ly' }, { path: '0.isUsable', equals: true }] },
    { name: '[200] Quản lý thấy khách đã được cấp 1 mã', method: 'GET', path: '/users/me/points', auth: 'ru', status: 200, expect: [{ path: 'points', equals: 250 }, { path: 'totalCups', equals: 10 }, { path: 'nextRewards.0.remaining', equals: 10 }] },
    { name: '[200] Hủy đơn đã trả tiền', method: 'POST', path: '/orders/{{orderR}}/cancel', auth: 'ru', body: {}, status: 200 },
    { name: '[200] Điểm và ly về 0 nhưng mã thưởng đã cấp vẫn còn', method: 'GET', path: '/promotions/mine', auth: 'ru', status: 200, expect: [{ path: '0.scope', equals: 'PERSONAL' }, { path: '0.isUsable', equals: true }] },
    { name: '[200] Điểm đã thu hồi', method: 'GET', path: '/users/me/points', auth: 'ru', status: 200, expect: [{ path: 'points', equals: 0 }, { path: 'totalCups', equals: 0 }] },

    // ───── Dọn dẹp ─────
    { name: 'Dọn: hủy đơn B (đã trả bằng thẻ)', method: 'POST', path: '/orders/{{orderB}}/cancel', auth: 'pay', body: {}, status: 200 },
    { name: 'Dọn: hủy đơn C (đã trả chuyển khoản)', method: 'POST', path: '/orders/{{orderC}}/cancel', auth: 'pay', body: {}, status: 200 },
    { name: 'Dọn: hủy đơn D (đã trả có mã giảm giá)', method: 'POST', path: '/orders/{{orderD}}/cancel', auth: 'pay', body: {}, status: 200 },
  ],
};
export default folder;
