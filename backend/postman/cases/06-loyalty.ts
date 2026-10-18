import { Case, Folder } from '../lib/dsl';

const rule = (over: Record<string, unknown> = {}) => ({
  name: 'Quy tắc thử nghiệm',
  kind: 'POINTS',
  threshold: 100,
  discountType: 'FIXED',
  discountValue: 5000,
  validDays: 10,
  ...over,
});

const cases: Case[] = [
  { name: 'Lấy id khách mẫu', method: 'GET', path: '/users/me', auth: 'customer', status: 200, save: { custId: 'id' } },

  // ───── GET /users/me/points ─────
  { name: '[200] Khách xem điểm và mốc thưởng kế tiếp', method: 'GET', path: '/users/me/points', auth: 'customer', status: 200, expect: [{ path: 'points', min: 1 }, { path: 'totalCups', min: 1 }, { path: 'amountStep', equals: 10000 }, { path: 'pointsPerStep', equals: 10 }, { path: 'nextRewards', isArray: true, min: 2 }, { path: 'nextRewards.0.remaining', min: 1 }] },
  { name: '[401] Xem điểm khi chưa đăng nhập', method: 'GET', path: '/users/me/points', status: 401 },
  { name: '[403] Nhân viên không có điểm tích lũy', method: 'GET', path: '/users/me/points', auth: 'staff', status: 403 },

  // ───── GET /admin/users/:id/points ─────
  { name: '[200] Quản lý xem điểm của khách', method: 'GET', path: '/admin/users/{{custId}}/points', auth: 'manager', status: 200, expect: [{ path: 'points', min: 1 }, { path: 'rewardsGranted', min: 10 }, { path: 'rewardsUsable', exists: true }] },
  { name: '[404] Khách không tồn tại', method: 'GET', path: '/admin/users/999999/points', auth: 'manager', status: 404 },
  { name: '[400] id không phải số', method: 'GET', path: '/admin/users/abc/points', auth: 'manager', status: 400 },
  { name: '[403] Nhân viên không xem được điểm của khách', method: 'GET', path: '/admin/users/{{custId}}/points', auth: 'staff', status: 403 },

  // ───── Tỉ lệ tích điểm ─────
  { name: '[200] Xem tỉ lệ tích điểm', method: 'GET', path: '/admin/loyalty/settings', auth: 'manager', status: 200, expect: [{ path: 'amountStep', equals: 10000 }, { path: 'pointsPerStep', equals: 10 }] },
  { name: '[200] Đổi tỉ lệ tích điểm', method: 'PATCH', path: '/admin/loyalty/settings', auth: 'manager', body: { amountStep: 5000, pointsPerStep: 5 }, status: 200, expect: [{ path: 'amountStep', equals: 5000 }, { path: 'pointsPerStep', equals: 5 }] },
  { name: '[200] Khách thấy tỉ lệ mới', method: 'GET', path: '/users/me/points', auth: 'customer', status: 200, expect: [{ path: 'amountStep', equals: 5000 }] },
  { name: '[200] Khôi phục tỉ lệ mặc định', method: 'PATCH', path: '/admin/loyalty/settings', auth: 'manager', body: { amountStep: 10000, pointsPerStep: 10 }, status: 200 },
  { name: '[400] Bước tiền dưới 1.000đ', method: 'PATCH', path: '/admin/loyalty/settings', auth: 'manager', body: { amountStep: 500 }, status: 400 },
  { name: '[400] Số điểm mỗi bước bằng 0', method: 'PATCH', path: '/admin/loyalty/settings', auth: 'manager', body: { pointsPerStep: 0 }, status: 400 },
  { name: '[403] Nhân viên không đổi được tỉ lệ', method: 'PATCH', path: '/admin/loyalty/settings', auth: 'staff', body: { amountStep: 5000 }, status: 403 },
  { name: '[401] Xem tỉ lệ khi chưa đăng nhập', method: 'GET', path: '/admin/loyalty/settings', status: 401 },

  // ───── Quy tắc thưởng ─────
  { name: '[200] Xem danh sách quy tắc thưởng', method: 'GET', path: '/admin/loyalty/rules', auth: 'manager', status: 200, expect: [{ path: 'total', min: 3 }, { path: 'items.0.kind', equals: 'CUPS' }, { path: 'items.0.productIds', isArray: true, min: 1 }] },
  { name: '[403] Nhân viên không xem được quy tắc', method: 'GET', path: '/admin/loyalty/rules', auth: 'staff', status: 403 },
  { name: '[201] Tạo quy tắc giảm tiền cố định', method: 'POST', path: '/admin/loyalty/rules', auth: 'manager', body: rule(), status: 201, save: { ruleId: 'id' }, expect: [{ path: 'isActive', equals: true }, { path: 'discountType', equals: 'FIXED' }] },
  // Quy tắc thử được tắt ngay để không tự cấp mã thưởng cho khách trong các lần test sau
  { name: 'Tắt ngay quy tắc thử', method: 'PATCH', path: '/admin/loyalty/rules/{{ruleId}}/active', auth: 'manager', body: { isActive: false }, status: 200, expect: [{ path: 'isActive', equals: false }] },
  { name: '[201] Tạo quy tắc tặng ly kèm danh sách món', method: 'POST', path: '/admin/loyalty/rules', auth: 'manager', body: rule({ kind: 'CUPS', threshold: 5, discountType: 'FREE_DRINK', discountValue: undefined, productIds: [1, 2] }), status: 201, save: { ruleId2: 'id' }, expect: [{ path: 'productIds', equals: [1, 2] }] },
  { name: 'Tắt ngay quy tắc thử thứ hai', method: 'PATCH', path: '/admin/loyalty/rules/{{ruleId2}}/active', auth: 'manager', body: { isActive: false }, status: 200 },
  { name: '[400] Giảm % thiếu mức giảm tối đa', method: 'POST', path: '/admin/loyalty/rules', auth: 'manager', body: rule({ discountType: 'PERCENT', discountValue: 10 }), status: 400 },
  { name: '[400] Mốc bằng 0', method: 'POST', path: '/admin/loyalty/rules', auth: 'manager', body: rule({ threshold: 0 }), status: 400 },
  { name: '[400] Hạn dùng vượt 365 ngày', method: 'POST', path: '/admin/loyalty/rules', auth: 'manager', body: rule({ validDays: 400 }), status: 400 },
  { name: '[400] Loại quy tắc không hợp lệ', method: 'POST', path: '/admin/loyalty/rules', auth: 'manager', body: rule({ kind: 'MONEY' }), status: 400 },
  { name: '[400] Tên quy tắc rỗng', method: 'POST', path: '/admin/loyalty/rules', auth: 'manager', body: rule({ name: '' }), status: 400 },
  { name: '[400] Tặng ly nhưng thiếu danh sách món', method: 'POST', path: '/admin/loyalty/rules', auth: 'manager', body: rule({ discountType: 'FREE_DRINK', discountValue: undefined }), status: 400 },
  { name: '[404] Danh sách món chứa món không tồn tại', method: 'POST', path: '/admin/loyalty/rules', auth: 'manager', body: rule({ discountType: 'FREE_DRINK', discountValue: undefined, productIds: [9999] }), status: 404 },
  { name: '[403] Nhân viên không tạo được quy tắc', method: 'POST', path: '/admin/loyalty/rules', auth: 'staff', body: rule(), status: 403 },
  { name: '[200] Sửa tên và mốc quy tắc', method: 'PATCH', path: '/admin/loyalty/rules/{{ruleId}}', auth: 'manager', body: { name: 'Đã đổi tên', threshold: 200 }, status: 200, expect: [{ path: 'name', equals: 'Đã đổi tên' }, { path: 'threshold', equals: 200 }] },
  { name: '[200] Đổi sang giảm % kèm mức tối đa', method: 'PATCH', path: '/admin/loyalty/rules/{{ruleId}}', auth: 'manager', body: { discountType: 'PERCENT', discountValue: 10, maxDiscountAmount: 30000 }, status: 200, expect: [{ path: 'discountType', equals: 'PERCENT' }] },
  { name: '[400] Đổi sang giảm tiền cố định nhưng giá trị bằng 0', method: 'PATCH', path: '/admin/loyalty/rules/{{ruleId}}', auth: 'manager', body: { discountType: 'FIXED', discountValue: 0 }, status: 400 },
  { name: '[400] Đổi sang tặng ly khi quy tắc chưa có món nào', method: 'PATCH', path: '/admin/loyalty/rules/{{ruleId}}', auth: 'manager', body: { discountType: 'FREE_DRINK' }, status: 400 },
  { name: '[400] Hạn dùng bằng 0', method: 'PATCH', path: '/admin/loyalty/rules/{{ruleId}}', auth: 'manager', body: { validDays: 0 }, status: 400 },
  { name: '[404] Sửa quy tắc không tồn tại', method: 'PATCH', path: '/admin/loyalty/rules/999999', auth: 'manager', body: { name: 'X' }, status: 404 },
  { name: '[403] Nhân viên không sửa được quy tắc', method: 'PATCH', path: '/admin/loyalty/rules/{{ruleId}}', auth: 'staff', body: { name: 'X' }, status: 403 },
  { name: '[200] Bật quy tắc có sẵn rồi tắt lại', method: 'PATCH', path: '/admin/loyalty/rules/3/active', auth: 'manager', body: { isActive: false }, status: 200, expect: [{ path: 'isActive', equals: false }] },
  { name: '[400] isActive không phải boolean', method: 'PATCH', path: '/admin/loyalty/rules/{{ruleId}}/active', auth: 'manager', body: { isActive: 'on' }, status: 400 },
  { name: '[404] Bật tắt quy tắc không tồn tại', method: 'PATCH', path: '/admin/loyalty/rules/999999/active', auth: 'manager', body: { isActive: true }, status: 404 },
];

const folder: Folder = {
  name: '06 · Tích điểm và thưởng (loyalty)',
  description: 'UC29 điểm của tôi, UC63 điểm của khách, UC69 thiết lập tích điểm và quy tắc thưởng.',
  cases,
};
export default folder;
