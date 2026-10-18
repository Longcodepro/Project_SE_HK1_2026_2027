import { Case, Folder } from '../lib/dsl';

const v = (code: string, query: Record<string, string | number> = {}, auth = 'puser') => ({ method: 'GET' as const, path: '/promotions/validate', auth, query: { code, subtotal: 100000, ...query } });

const promo = (over: Record<string, unknown> = {}) => ({
  code: '{{promoCode}}',
  discountType: 'PERCENT',
  discountValue: 15,
  maxDiscountAmount: 20000,
  minOrderAmount: 30000,
  maxTotalUses: 5,
  maxUsesPerUser: 2,
  startsAt: '{{startsAt}}',
  endsAt: '{{endsAt}}',
  ...over,
});

// Dùng khách mới để số lần đã dùng mã luôn bằng 0, không phụ thuộc dữ liệu mẫu
const setup: Case[] = [
  { name: 'Tạo khách mới: đăng ký', method: 'POST', path: '/auth/register', set: { phoneP: 'phone' }, body: { phone: '{{phoneP}}', password: 'Matkhau123', fullName: 'Khách Khuyến Mãi' }, status: 201 },
  { name: 'Tạo khách mới: xác thực OTP', method: 'POST', path: '/auth/verify-otp', body: { phone: '{{phoneP}}', code: '123456' }, status: 200, save: { puserToken: 'token' } },
];

const folder: Folder = {
  name: '05 · Khuyến mãi (promotions)',
  description: 'UC19 xem trước mã, UC70 mã của tôi, UC56-UC59 quản lý mã.',
  cases: [
    ...setup,

    // ───── GET /promotions/validate ─────
    { name: '[200] Mã giảm % hợp lệ', ...v('WELCOME10'), status: 200, expect: [{ path: 'discountAmount', equals: 10000 }, { path: 'promotion.code', equals: 'WELCOME10' }, { path: 'promotion.label', matches: '^Giảm 10%' }] },
    { name: '[200] Mã gõ chữ thường vẫn nhận', ...v('welcome10'), status: 200, expect: [{ path: 'promotion.code', equals: 'WELCOME10' }] },
    { name: '[200] Mã giảm % bị chặn bởi mức giảm tối đa', ...v('WELCOME10', { subtotal: 1000000 }), status: 200, expect: [{ path: 'discountAmount', equals: 30000 }] },
    { name: '[200] Mã giảm tiền cố định', ...v('GIAM20K'), status: 200, expect: [{ path: 'discountAmount', equals: 20000 }] },
    { name: '[200] Mã giảm tiền không vượt quá tổng đơn', ...v('STUDENT5', { subtotal: 3000 }), status: 200, expect: [{ path: 'discountAmount', equals: 3000 }] },
    { name: '[200] Mã tặng ly: giảm đúng giá ly được chọn', ...v('FREECUP', { pickedCup: 0, pickedProductId: 1, cupPrice: 45000 }), status: 200, expect: [{ path: 'discountAmount', equals: 45000 }] },
    { name: '[200] Mã tặng ly bị chặn bởi mức giảm tối đa', ...v('FREECUP', { pickedCup: 0, pickedProductId: 1, cupPrice: 80000 }), status: 200, expect: [{ path: 'discountAmount', equals: 50000 }] },
    { name: '[422] Mã tặng ly nhưng chưa chọn ly', ...v('FREECUP'), status: 422 },
    { name: '[422] Mã tặng ly: ly chọn không thuộc danh sách món', ...v('FREECUP', { pickedCup: 0, pickedProductId: 2, cupPrice: 40000 }), status: 422 },
    { name: '[422] Chưa đủ đơn tối thiểu', ...v('WELCOME10', { subtotal: 10000 }), status: 422 },
    { name: '[422] Mã đã hết hạn', ...v('HETHAN01'), status: 422 },
    { name: '[422] Mã chưa tới ngày áp dụng', ...v('SAPDIENRA'), status: 422 },
    { name: '[422] Mã đã bị vô hiệu hóa', ...v('TAMDUNG01'), status: 422 },
    { name: '[422] Mã đã hết lượt dùng', ...v('CHILAN1'), status: 422 },
    { name: '[422] Mã không tồn tại', ...v('KHONGCOMANAY'), status: 422 },
    { name: '[400] Thiếu mã', method: 'GET', path: '/promotions/validate', auth: 'puser', query: { subtotal: 1000 }, status: 400 },
    { name: '[400] Thiếu tạm tính', method: 'GET', path: '/promotions/validate', auth: 'puser', query: { code: 'WELCOME10' }, status: 400 },
    { name: '[400] Tạm tính âm', ...v('WELCOME10', { subtotal: -5 }), status: 400 },
    { name: '[400] Tạm tính không phải số', ...v('WELCOME10', { subtotal: 'abc' }), status: 400 },
    { name: '[401] Xem trước mã khi chưa đăng nhập', method: 'GET', path: '/promotions/validate', query: { code: 'WELCOME10', subtotal: 100000 }, status: 401 },
    { name: '[403] Nhân viên không dùng được chức năng của khách', ...v('WELCOME10', {}, 'staff'), status: 403 },

    // ───── GET /promotions/mine ─────
    { name: '[200] Khách có nhiều mã riêng và mã chung', method: 'GET', path: '/promotions/mine', auth: 'customer', status: 200, expect: [{ path: '', isArray: true, min: 10 }, { path: '0.code', exists: true }, { path: '0.label', exists: true }, { path: '0.expiresAt', exists: true }, { path: '0.isUsable', exists: true }] },
    { name: '[200] Khách mới chỉ thấy mã chung', method: 'GET', path: '/promotions/mine', auth: 'puser', status: 200, expect: [{ path: '', isArray: true, min: 3 }, { path: '0.scope', equals: 'PUBLIC' }] },
    { name: '[401] Mã của tôi khi chưa đăng nhập', method: 'GET', path: '/promotions/mine', status: 401 },
    { name: '[403] Nhân viên không có mã của tôi', method: 'GET', path: '/promotions/mine', auth: 'staff', status: 403 },

    // ───── GET /admin/promotions ─────
    { name: '[200] Quản lý xem danh sách mã (kèm lượt dùng và trạng thái)', method: 'GET', path: '/admin/promotions', auth: 'manager', query: { pageSize: 50 }, status: 200, expect: [{ path: 'total', min: 100 }, { path: 'items.0.status', exists: true }, { path: 'items.0.usedCount', exists: true }, { path: 'items.0.maxTotalUses', exists: true }] },
    { name: '[200] Lọc mã đã hết hạn', method: 'GET', path: '/admin/promotions', auth: 'manager', query: { status: 'expired', scope: 'PUBLIC' }, status: 200, expect: [{ path: 'items.0.status', equals: 'expired' }, { path: 'items.0.code', equals: 'HETHAN01' }] },
    { name: '[200] Lọc mã đã hết lượt', method: 'GET', path: '/admin/promotions', auth: 'manager', query: { status: 'exhausted' }, status: 200, expect: [{ path: 'items.0.code', equals: 'CHILAN1' }] },
    { name: '[200] Lọc mã bị vô hiệu hóa', method: 'GET', path: '/admin/promotions', auth: 'manager', query: { status: 'disabled' }, status: 200, expect: [{ path: 'total', min: 1 }, { path: 'items.0.status', equals: 'disabled' }, { path: 'items.0.isActive', equals: false }] },
    { name: '[200] Lọc mã chưa tới hạn', method: 'GET', path: '/admin/promotions', auth: 'manager', query: { status: 'upcoming' }, status: 200, expect: [{ path: 'items.0.code', equals: 'SAPDIENRA' }] },
    { name: '[200] Lọc mã riêng', method: 'GET', path: '/admin/promotions', auth: 'manager', query: { scope: 'PERSONAL', pageSize: 5 }, status: 200, save: { personalPromoId: 'items.0.id' }, expect: [{ path: 'items.0.scope', equals: 'PERSONAL' }, { path: 'pageSize', equals: 5 }] },
    { name: '[400] Trạng thái lọc không hợp lệ', method: 'GET', path: '/admin/promotions', auth: 'manager', query: { status: 'abc' }, status: 400 },
    { name: '[403] Nhân viên không xem được danh sách mã', method: 'GET', path: '/admin/promotions', auth: 'staff', status: 403 },
    { name: '[401] Danh sách mã khi chưa đăng nhập', method: 'GET', path: '/admin/promotions', status: 401 },

    // ───── POST /admin/promotions ─────
    { name: '[201] Tạo mã giảm %', method: 'POST', path: '/admin/promotions', auth: 'manager', set: { promoCode: 'code', startsAt: 'isoDays:-1', endsAt: 'isoDays:30' }, body: promo(), status: 201, save: { promoId: 'id' }, expect: [{ path: 'scope', equals: 'PUBLIC' }, { path: 'status', equals: 'active' }, { path: 'usedCount', equals: 0 }, { path: 'code', matches: '^T\\d{8}$' }] },
    { name: '[201] Tạo mã giảm tiền cố định', method: 'POST', path: '/admin/promotions', auth: 'manager', set: { promoCode2: 'code' }, body: promo({ code: '{{promoCode2}}', discountType: 'FIXED', discountValue: 10000, maxDiscountAmount: undefined }), status: 201, save: { promoId2: 'id' } },
    { name: '[201] Tạo mã tặng ly kèm danh sách món', method: 'POST', path: '/admin/promotions', auth: 'manager', set: { promoCode3: 'code' }, body: promo({ code: '{{promoCode3}}', discountType: 'FREE_DRINK', discountValue: undefined, maxDiscountAmount: undefined, productIds: [1, 2] }), status: 201, expect: [{ path: 'productIds', equals: [1, 2] }] },
    { name: '[201] Mã gõ chữ thường được lưu chữ hoa', method: 'POST', path: '/admin/promotions', auth: 'manager', set: { promoCode4: 'code' }, body: promo({ code: 'abc{{promoCode4}}'.slice(0, 20) }), status: 201, expect: [{ path: 'code', matches: '^ABC' }] },
    { name: '[409] Mã đã tồn tại', method: 'POST', path: '/admin/promotions', auth: 'manager', body: promo({ code: 'WELCOME10' }), status: 409 },
    { name: '[400] Giảm % thiếu mức giảm tối đa', method: 'POST', path: '/admin/promotions', auth: 'manager', body: promo({ code: 'THIEUMAX1', maxDiscountAmount: undefined }), status: 400 },
    { name: '[400] Giảm % vượt 100', method: 'POST', path: '/admin/promotions', auth: 'manager', body: promo({ code: 'QUA100PT', discountValue: 101 }), status: 400 },
    { name: '[400] Giảm % bằng 0', method: 'POST', path: '/admin/promotions', auth: 'manager', body: promo({ code: 'KHONG0PT', discountValue: 0 }), status: 400 },
    { name: '[400] Giảm tiền cố định không được có mức giảm tối đa', method: 'POST', path: '/admin/promotions', auth: 'manager', body: promo({ code: 'FIXEDMAX', discountType: 'FIXED', discountValue: 5000 }), status: 400 },
    { name: '[400] Giảm tiền cố định bằng 0', method: 'POST', path: '/admin/promotions', auth: 'manager', body: promo({ code: 'FIXED0VND', discountType: 'FIXED', discountValue: 0, maxDiscountAmount: undefined }), status: 400 },
    { name: '[400] Mã tặng ly thiếu danh sách món', method: 'POST', path: '/admin/promotions', auth: 'manager', body: promo({ code: 'FREEKHONG', discountType: 'FREE_DRINK', discountValue: undefined, maxDiscountAmount: undefined }), status: 400 },
    { name: '[400] Mã tặng ly không có giá trị giảm', method: 'POST', path: '/admin/promotions', auth: 'manager', body: promo({ code: 'FREEVALUE', discountType: 'FREE_DRINK', discountValue: 5, maxDiscountAmount: undefined, productIds: [1] }), status: 400 },
    { name: '[400] Mã giảm % lại có danh sách món', method: 'POST', path: '/admin/promotions', auth: 'manager', body: promo({ code: 'PCTMON01', productIds: [1] }), status: 400 },
    { name: '[400] Ngày kết thúc trước ngày bắt đầu', method: 'POST', path: '/admin/promotions', auth: 'manager', body: promo({ code: 'NGAYSAI01', startsAt: '{{endsAt}}', endsAt: '{{startsAt}}' }), status: 400 },
    { name: '[400] Mã quá ngắn', method: 'POST', path: '/admin/promotions', auth: 'manager', body: promo({ code: 'AB' }), status: 400 },
    { name: '[400] Mã có ký tự đặc biệt', method: 'POST', path: '/admin/promotions', auth: 'manager', body: promo({ code: 'GIAM-20%' }), status: 400 },
    { name: '[400] Thiếu ngày bắt đầu', method: 'POST', path: '/admin/promotions', auth: 'manager', body: promo({ code: 'THIEUNGAY', startsAt: undefined }), status: 400 },
    { name: '[400] Ngày không đúng định dạng', method: 'POST', path: '/admin/promotions', auth: 'manager', body: promo({ code: 'NGAYLOI01', startsAt: 'hôm qua' }), status: 400 },
    { name: '[400] Tổng lượt bằng 0', method: 'POST', path: '/admin/promotions', auth: 'manager', body: promo({ code: 'LUOT0001', maxTotalUses: 0 }), status: 400 },
    { name: '[404] Danh sách món chứa món không tồn tại', method: 'POST', path: '/admin/promotions', auth: 'manager', body: promo({ code: 'MONMA9999', discountType: 'FREE_DRINK', discountValue: undefined, maxDiscountAmount: undefined, productIds: [1, 9999] }), status: 404 },
    { name: '[403] Nhân viên không tạo được mã', method: 'POST', path: '/admin/promotions', auth: 'staff', body: promo({ code: 'NHANVIEN1' }), status: 403 },
    { name: '[401] Tạo mã khi chưa đăng nhập', method: 'POST', path: '/admin/promotions', body: promo({ code: 'KHACH0001' }), status: 401 },
    { name: '[200] Mã vừa tạo dùng được ngay', ...v('{{promoCode}}', { subtotal: 100000 }), status: 200, expect: [{ path: 'discountAmount', equals: 15000 }] },

    // ───── PATCH /admin/promotions/:id ─────
    { name: '[200] Mã chưa dùng sửa được cả cách giảm', method: 'PATCH', path: '/admin/promotions/{{promoId}}', auth: 'manager', body: { discountValue: 20, maxDiscountAmount: 50000 }, status: 200, expect: [{ path: 'discountValue', equals: 20 }, { path: 'maxDiscountAmount', equals: 50000 }] },
    { name: '[200] Đổi sang kiểu giảm tiền cố định', method: 'PATCH', path: '/admin/promotions/{{promoId}}', auth: 'manager', body: { discountType: 'FIXED', discountValue: 7000 }, status: 200, expect: [{ path: 'discountType', equals: 'FIXED' }, { path: 'maxDiscountAmount', equals: null }] },
    { name: '[200] Đổi đơn tối thiểu và tổng lượt', method: 'PATCH', path: '/admin/promotions/{{promoId}}', auth: 'manager', body: { minOrderAmount: 0, maxTotalUses: 100, maxUsesPerUser: 3 }, status: 200, expect: [{ path: 'minOrderAmount', equals: 0 }, { path: 'maxTotalUses', equals: 100 }] },
    { name: '[400] Sửa thành dữ liệu sai (giảm % vượt 100)', method: 'PATCH', path: '/admin/promotions/{{promoId2}}', auth: 'manager', body: { discountType: 'PERCENT', discountValue: 150, maxDiscountAmount: 1000 }, status: 400 },
    { name: '[400] Sửa ngày kết thúc trước ngày bắt đầu', method: 'PATCH', path: '/admin/promotions/{{promoId}}', auth: 'manager', set: { pastDate: 'isoDays:-60' }, body: { endsAt: '{{pastDate}}' }, status: 400 },
    { name: '[409] Mã đã có lượt dùng không đổi được cách giảm (WELCOME10)', method: 'PATCH', path: '/admin/promotions/1', auth: 'manager', body: { discountValue: 50 }, status: 409 },
    { name: '[200] Mã đã dùng vẫn đổi được hạn và đơn tối thiểu', method: 'PATCH', path: '/admin/promotions/1', auth: 'manager', set: { farDate: 'isoDays:400' }, body: { endsAt: '{{farDate}}', minOrderAmount: 50000 }, status: 200 },
    { name: '[409] Mã riêng do hệ thống cấp, không sửa được', method: 'PATCH', path: '/admin/promotions/{{personalPromoId}}', auth: 'manager', body: { minOrderAmount: 1 }, status: 409 },
    { name: '[404] Sửa mã không tồn tại', method: 'PATCH', path: '/admin/promotions/999999', auth: 'manager', body: { minOrderAmount: 1 }, status: 404 },
    { name: '[403] Nhân viên không sửa được mã', method: 'PATCH', path: '/admin/promotions/{{promoId}}', auth: 'staff', body: { minOrderAmount: 1 }, status: 403 },

    // ───── PATCH /admin/promotions/:id/deactivate ─────
    { name: '[200] Vô hiệu hóa mã', method: 'PATCH', path: '/admin/promotions/{{promoId}}/deactivate', auth: 'manager', status: 200, expect: [{ path: 'isActive', equals: false }, { path: 'status', equals: 'disabled' }] },
    { name: '[422] Mã đã vô hiệu hóa không dùng được nữa', ...v('{{promoCode}}'), status: 422 },
    { name: '[404] Vô hiệu hóa mã không tồn tại', method: 'PATCH', path: '/admin/promotions/999999/deactivate', auth: 'manager', status: 404 },
    { name: '[403] Nhân viên không vô hiệu hóa được mã', method: 'PATCH', path: '/admin/promotions/{{promoId2}}/deactivate', auth: 'staff', status: 403 },
    { name: 'Dọn: vô hiệu hóa mã thử thứ hai', method: 'PATCH', path: '/admin/promotions/{{promoId2}}/deactivate', auth: 'manager', status: 200 },
  ],
};
export default folder;
