import { Folder } from '../lib/dsl';

const bank = (over: Record<string, unknown> = {}) => ({
  amount: 10000,
  destinationType: 'EWALLET',
  accountName: 'NGUYEN VAN A',
  accountNumber: '0901234567',
  ...over,
});

const folder: Folder = {
  name: '07 · Ví hoàn tiền (wallet)',
  description: 'UC71 xem ví, UC72 yêu cầu rút tiền, UC73 quản lý xử lý rút tiền. Hoàn tiền vào ví được test ở folder đơn hàng.',
  cases: [
    { name: 'Tạo khách mới (ví trống): đăng ký', method: 'POST', path: '/auth/register', set: { phoneW: 'phone' }, body: { phone: '{{phoneW}}', password: 'Matkhau123', fullName: 'Khách Ví Trống' }, status: 201 },
    { name: 'Tạo khách mới (ví trống): xác thực OTP', method: 'POST', path: '/auth/verify-otp', body: { phone: '{{phoneW}}', code: '123456' }, status: 200, save: { wuserToken: 'token' } },

    // ───── GET /wallet ─────
    { name: '[200] Khách xem ví có số dư và lịch sử', method: 'GET', path: '/wallet', auth: 'customer', status: 200, expect: [{ path: 'balance', min: 100000 }, { path: 'transactions', isArray: true, min: 1 }, { path: 'transactions.0.type', exists: true }, { path: 'transactions.0.amount', min: 1 }] },
    { name: '[200] Khách mới có ví trống', method: 'GET', path: '/wallet', auth: 'wuser', status: 200, expect: [{ path: 'balance', equals: 0 }, { path: 'transactions', equals: [] }] },
    { name: '[401] Xem ví khi chưa đăng nhập', method: 'GET', path: '/wallet', status: 401 },
    { name: '[403] Nhân viên không có ví', method: 'GET', path: '/wallet', auth: 'staff', status: 403 },

    // ───── POST /wallet/withdrawals ─────
    { name: '[400] Số tiền dưới 10.000đ', method: 'POST', path: '/wallet/withdrawals', auth: 'customer', body: bank({ amount: 5000 }), status: 400 },
    { name: '[400] Số tiền không phải số nguyên', method: 'POST', path: '/wallet/withdrawals', auth: 'customer', body: bank({ amount: 10000.5 }), status: 400 },
    { name: '[400] Loại nhận không hợp lệ', method: 'POST', path: '/wallet/withdrawals', auth: 'customer', body: bank({ destinationType: 'CASH' }), status: 400 },
    { name: '[400] Thiếu tên chủ tài khoản', method: 'POST', path: '/wallet/withdrawals', auth: 'customer', body: bank({ accountName: undefined }), status: 400 },
    { name: '[400] Số tài khoản quá 30 ký tự', method: 'POST', path: '/wallet/withdrawals', auth: 'customer', body: bank({ accountNumber: '1'.repeat(31) }), status: 400 },
    { name: '[400] Tài khoản ngân hàng thiếu tên ngân hàng', method: 'POST', path: '/wallet/withdrawals', auth: 'customer', body: bank({ destinationType: 'BANK' }), status: 400 },
    { name: '[400] Thẻ thiếu tên ngân hàng', method: 'POST', path: '/wallet/withdrawals', auth: 'customer', body: bank({ destinationType: 'CARD', bankName: '  ' }), status: 400 },
    { name: '[422] Rút khi ví trống', method: 'POST', path: '/wallet/withdrawals', auth: 'wuser', body: bank(), status: 422 },
    { name: '[422] Rút nhiều hơn số dư', method: 'POST', path: '/wallet/withdrawals', auth: 'customer', body: bank({ amount: 999999999 }), status: 422 },
    { name: '[201] Yêu cầu rút vào ví điện tử', method: 'POST', path: '/wallet/withdrawals', auth: 'customer', body: bank(), status: 201, save: { wdId1: 'id' }, expect: [{ path: 'status', equals: 'PENDING' }, { path: 'amount', equals: 10000 }, { path: 'bankName', equals: null }] },
    { name: '[200] Ví bị trừ ngay khi gửi yêu cầu', method: 'GET', path: '/wallet', auth: 'customer', status: 200, expect: [{ path: 'transactions.0.type', equals: 'WITHDRAW_OUT' }, { path: 'transactions.0.amount', equals: 10000 }] },
    { name: '[201] Yêu cầu rút về tài khoản ngân hàng', method: 'POST', path: '/wallet/withdrawals', auth: 'customer', body: bank({ amount: 11000, destinationType: 'BANK', bankName: 'Vietcombank' }), status: 201, save: { wdId2: 'id' }, expect: [{ path: 'bankName', equals: 'Vietcombank' }] },
    { name: '[201] Yêu cầu rút về thẻ', method: 'POST', path: '/wallet/withdrawals', auth: 'customer', body: bank({ amount: 12000, destinationType: 'CARD', bankName: 'MB Bank' }), status: 201, save: { wdId3: 'id' } },
    { name: '[403] Nhân viên không rút tiền được', method: 'POST', path: '/wallet/withdrawals', auth: 'staff', body: bank(), status: 403 },
    { name: '[401] Rút tiền khi chưa đăng nhập', method: 'POST', path: '/wallet/withdrawals', body: bank(), status: 401 },
    { name: '[200] Khách xem các yêu cầu rút của mình', method: 'GET', path: '/wallet/withdrawals', auth: 'customer', status: 200, expect: [{ path: '', isArray: true, min: 3 }, { path: '0.status', equals: 'PENDING' }] },
    { name: '[200] Khách mới chưa có yêu cầu nào', method: 'GET', path: '/wallet/withdrawals', auth: 'wuser', status: 200, expect: [{ path: '', equals: [] }] },
    { name: '[401] Xem yêu cầu rút khi chưa đăng nhập', method: 'GET', path: '/wallet/withdrawals', status: 401 },

    // ───── GET /admin/withdrawals ─────
    { name: '[200] Quản lý xem các yêu cầu rút tiền', method: 'GET', path: '/admin/withdrawals', auth: 'manager', status: 200, expect: [{ path: 'total', min: 9 }, { path: 'items.0.user.phone', exists: true }, { path: 'items.0.user.fullName', exists: true }] },
    { name: '[200] Lọc yêu cầu đang chờ', method: 'GET', path: '/admin/withdrawals', auth: 'manager', query: { status: 'PENDING' }, status: 200, expect: [{ path: 'total', min: 4 }, { path: 'items.0.status', equals: 'PENDING' }] },
    { name: '[200] Lọc yêu cầu đã hoàn tất', method: 'GET', path: '/admin/withdrawals', auth: 'manager', query: { status: 'COMPLETED' }, status: 200, expect: [{ path: 'items.0.status', equals: 'COMPLETED' }, { path: 'items.0.transferRef', exists: true }] },
    { name: '[200] Lọc yêu cầu bị từ chối', method: 'GET', path: '/admin/withdrawals', auth: 'manager', query: { status: 'REJECTED' }, status: 200, expect: [{ path: 'items.0.rejectReason', exists: true }] },
    { name: '[400] Trạng thái lọc không hợp lệ', method: 'GET', path: '/admin/withdrawals', auth: 'manager', query: { status: 'DONE' }, status: 400 },
    { name: '[403] Nhân viên không xem được yêu cầu rút tiền', method: 'GET', path: '/admin/withdrawals', auth: 'staff', status: 403 },
    { name: '[401] Yêu cầu rút tiền khi chưa đăng nhập', method: 'GET', path: '/admin/withdrawals', status: 401 },

    // ───── PATCH /admin/withdrawals/:id/complete ─────
    { name: '[400] Hoàn tất thiếu mã giao dịch', method: 'PATCH', path: '/admin/withdrawals/{{wdId1}}/complete', auth: 'manager', body: {}, status: 400 },
    { name: '[400] Mã giao dịch quá 50 ký tự', method: 'PATCH', path: '/admin/withdrawals/{{wdId1}}/complete', auth: 'manager', body: { transferRef: 'X'.repeat(51) }, status: 400 },
    { name: '[403] Nhân viên không hoàn tất được yêu cầu', method: 'PATCH', path: '/admin/withdrawals/{{wdId1}}/complete', auth: 'staff', body: { transferRef: 'CK1' }, status: 403 },
    { name: '[200] Quản lý hoàn tất yêu cầu', method: 'PATCH', path: '/admin/withdrawals/{{wdId1}}/complete', auth: 'manager', body: { transferRef: 'CK20261018001' }, status: 200, expect: [{ path: 'status', equals: 'COMPLETED' }, { path: 'transferRef', equals: 'CK20261018001' }, { path: 'handledByUserId', exists: true }, { path: 'handledAt', exists: true }] },
    { name: '[409] Hoàn tất lại yêu cầu đã xử lý', method: 'PATCH', path: '/admin/withdrawals/{{wdId1}}/complete', auth: 'manager', body: { transferRef: 'CK2' }, status: 409 },
    { name: '[409] Từ chối yêu cầu đã hoàn tất', method: 'PATCH', path: '/admin/withdrawals/{{wdId1}}/reject', auth: 'manager', body: { rejectReason: 'Không còn hợp lệ' }, status: 409 },
    { name: '[404] Hoàn tất yêu cầu không tồn tại', method: 'PATCH', path: '/admin/withdrawals/999999/complete', auth: 'manager', body: { transferRef: 'CK3' }, status: 404 },
    { name: '[400] id không phải số', method: 'PATCH', path: '/admin/withdrawals/abc/complete', auth: 'manager', body: { transferRef: 'CK3' }, status: 400 },

    // ───── PATCH /admin/withdrawals/:id/reject ─────
    { name: '[400] Từ chối thiếu lý do', method: 'PATCH', path: '/admin/withdrawals/{{wdId2}}/reject', auth: 'manager', body: {}, status: 400 },
    { name: '[400] Lý do dưới 5 ký tự', method: 'PATCH', path: '/admin/withdrawals/{{wdId2}}/reject', auth: 'manager', body: { rejectReason: 'ko' }, status: 400 },
    { name: '[403] Nhân viên không từ chối được yêu cầu', method: 'PATCH', path: '/admin/withdrawals/{{wdId2}}/reject', auth: 'staff', body: { rejectReason: 'Không hợp lệ' }, status: 403 },
    { name: '[200] Quản lý từ chối yêu cầu', method: 'PATCH', path: '/admin/withdrawals/{{wdId2}}/reject', auth: 'manager', body: { rejectReason: 'Sai thông tin tài khoản nhận' }, status: 200, expect: [{ path: 'status', equals: 'REJECTED' }, { path: 'rejectReason', equals: 'Sai thông tin tài khoản nhận' }] },
    { name: '[200] Tiền được trả lại ví sau khi bị từ chối', method: 'GET', path: '/wallet', auth: 'customer', status: 200, expect: [{ path: 'transactions.0.type', equals: 'WITHDRAW_RETURN' }, { path: 'transactions.0.amount', equals: 11000 }] },
    { name: '[409] Từ chối lại yêu cầu đã xử lý', method: 'PATCH', path: '/admin/withdrawals/{{wdId2}}/reject', auth: 'manager', body: { rejectReason: 'Từ chối lần hai' }, status: 409 },
    { name: '[404] Từ chối yêu cầu không tồn tại', method: 'PATCH', path: '/admin/withdrawals/999999/reject', auth: 'manager', body: { rejectReason: 'Không tồn tại' }, status: 404 },
    { name: 'Dọn: từ chối yêu cầu thử còn lại để trả tiền về ví', method: 'PATCH', path: '/admin/withdrawals/{{wdId3}}/reject', auth: 'manager', body: { rejectReason: 'Dọn dữ liệu thử nghiệm' }, status: 200 },
  ],
};
export default folder;
