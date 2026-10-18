import { Case, Folder } from '../lib/dsl';

const PW = 'Matkhau123';
const NEW_PW = 'MatkhauMoi456';

// Tạo một khách mới (đăng ký + xác thực OTP) để thử sửa/khóa mà không đụng tới tài khoản mẫu
const makeUser = (): Case[] => [
  { name: 'Tạo khách mới: đăng ký', method: 'POST', path: '/auth/register', set: { phoneU: 'phone', emailU: 'email' }, body: { phone: '{{phoneU}}', password: PW, fullName: 'Khách Hồ Sơ' }, status: 201 },
  { name: 'Tạo khách mới: xác thực OTP', method: 'POST', path: '/auth/verify-otp', body: { phone: '{{phoneU}}', code: '123456' }, status: 200, save: { userToken: 'token', userId: 'user.id' } },
];

const folder: Folder = {
  name: '03 · Người dùng (users)',
  description: 'UC04 xem hồ sơ, UC05 sửa hồ sơ, UC06 đổi mật khẩu, UC60-62 quản lý tài khoản, UC75 tạo nhân viên.',
  cases: [
    ...makeUser(),
    { name: 'Lấy id quản lý', method: 'GET', path: '/users/me', auth: 'manager', status: 200, save: { managerId: 'id' } },

    // ───── GET /users/me ─────
    { name: '[200] Khách xem hồ sơ của mình', method: 'GET', path: '/users/me', auth: 'customer', status: 200, expect: [{ path: 'phone', equals: '0922000001' }, { path: 'role', equals: 'CUSTOMER' }, { path: 'passwordHash', exists: false }, { path: 'loyaltyPoints', exists: true }, { path: 'walletBalance', exists: true }] },
    { name: '[200] Nhân viên cũng xem được hồ sơ của mình', method: 'GET', path: '/users/me', auth: 'staff', status: 200, expect: [{ path: 'role', equals: 'STAFF' }] },
    { name: '[401] Xem hồ sơ khi chưa đăng nhập', method: 'GET', path: '/users/me', status: 401 },
    { name: '[401] Xem hồ sơ với token sai', method: 'GET', path: '/users/me', auth: 'expired', status: 401 },

    // ───── PATCH /users/me ─────
    { name: '[200] Đổi họ tên và thêm email', method: 'PATCH', path: '/users/me', auth: 'user', body: { fullName: 'Tên Mới', email: '{{emailU}}' }, status: 200, expect: [{ path: 'fullName', equals: 'Tên Mới' }, { path: 'email', exists: true }] },
    { name: '[200] Email được lưu chữ thường', method: 'PATCH', path: '/users/me', auth: 'user', body: { email: 'KhachChuHoa@Example.COM' }, status: 200, expect: [{ path: 'email', equals: 'khachchuhoa@example.com' }] },
    { name: '[200] Xóa email bằng null', method: 'PATCH', path: '/users/me', auth: 'user', body: { email: null }, status: 200, expect: [{ path: 'email', equals: null }] },
    { name: '[200] Gửi số điện thoại mới bị bỏ qua (không đổi được)', method: 'PATCH', path: '/users/me', auth: 'user', body: { phone: '0999999999', fullName: 'Vẫn Là Tên Này' }, status: 200, expect: [{ path: 'phone', matches: '^0988' }, { path: 'fullName', equals: 'Vẫn Là Tên Này' }] },
    { name: '[400] Email sai dạng', method: 'PATCH', path: '/users/me', auth: 'user', body: { email: 'khong-hop-le' }, status: 400 },
    { name: '[400] Họ tên rỗng', method: 'PATCH', path: '/users/me', auth: 'user', body: { fullName: '   ' }, status: 400 },
    { name: '[400] Họ tên quá 100 ký tự', method: 'PATCH', path: '/users/me', auth: 'user', body: { fullName: 'A'.repeat(101) }, status: 400 },
    { name: '[409] Email đã có người dùng', method: 'PATCH', path: '/users/me', auth: 'user', body: { email: 'khach1@example.com' }, status: 409 },
    { name: '[401] Sửa hồ sơ khi chưa đăng nhập', method: 'PATCH', path: '/users/me', body: { fullName: 'X' }, status: 401 },

    // ───── PATCH /users/me/password ─────
    { name: '[400] Mật khẩu mới dưới 8 ký tự', method: 'PATCH', path: '/users/me/password', auth: 'user', body: { oldPassword: PW, newPassword: '123' }, status: 400 },
    { name: '[400] Thiếu mật khẩu cũ', method: 'PATCH', path: '/users/me/password', auth: 'user', body: { newPassword: NEW_PW }, status: 400 },
    { name: '[401] Mật khẩu cũ sai', method: 'PATCH', path: '/users/me/password', auth: 'user', body: { oldPassword: 'saimatkhau', newPassword: NEW_PW }, status: 401 },
    { name: '[401] Đổi mật khẩu khi chưa đăng nhập', method: 'PATCH', path: '/users/me/password', body: { oldPassword: PW, newPassword: NEW_PW }, status: 401 },
    { name: '[200] Đổi mật khẩu thành công', method: 'PATCH', path: '/users/me/password', auth: 'user', body: { oldPassword: PW, newPassword: NEW_PW }, status: 200 },
    { name: '[200] Đăng nhập bằng mật khẩu mới', method: 'POST', path: '/auth/login', body: { phone: '{{phoneU}}', password: NEW_PW }, status: 200 },
    { name: '[401] Mật khẩu cũ không còn dùng được', method: 'POST', path: '/auth/login', body: { phone: '{{phoneU}}', password: PW }, status: 401 },

    // ───── GET /admin/users ─────
    { name: '[200] Quản lý xem danh sách (mặc định chỉ khách hàng)', method: 'GET', path: '/admin/users', auth: 'manager', status: 200, expect: [{ path: 'items', isArray: true, min: 1 }, { path: 'total', min: 60 }, { path: 'pageSize', equals: 20 }, { path: 'items.0.role', equals: 'CUSTOMER' }, { path: 'items.0.passwordHash', exists: false }] },
    { name: '[200] Tìm theo số điện thoại', method: 'GET', path: '/admin/users', auth: 'manager', query: { search: '0922000001' }, status: 200, save: { firstCustomerId: 'items.0.id' }, expect: [{ path: 'total', equals: 1 }, { path: 'items.0.phone', equals: '0922000001' }] },
    { name: '[200] Lọc nhân viên', method: 'GET', path: '/admin/users', auth: 'manager', query: { role: 'STAFF' }, status: 200, expect: [{ path: 'items.0.role', equals: 'STAFF' }, { path: 'total', min: 5 }] },
    { name: '[200] Lọc quản lý', method: 'GET', path: '/admin/users', auth: 'manager', query: { role: 'MANAGER' }, status: 200, expect: [{ path: 'items.0.role', equals: 'MANAGER' }] },
    { name: '[200] Lọc tài khoản bị khóa', method: 'GET', path: '/admin/users', auth: 'manager', query: { isActive: false }, status: 200, expect: [{ path: 'total', min: 3 }, { path: 'items.0.isActive', equals: false }] },
    { name: '[200] Phân trang pageSize=2 page=2', method: 'GET', path: '/admin/users', auth: 'manager', query: { pageSize: 2, page: 2 }, status: 200, expect: [{ path: 'pageSize', equals: 2 }, { path: 'page', equals: 2 }, { path: 'items', isArray: true, min: 2 }] },
    { name: '[400] pageSize vượt 50', method: 'GET', path: '/admin/users', auth: 'manager', query: { pageSize: 100 }, status: 400 },
    { name: '[400] page = 0', method: 'GET', path: '/admin/users', auth: 'manager', query: { page: 0 }, status: 400 },
    { name: '[400] role không hợp lệ', method: 'GET', path: '/admin/users', auth: 'manager', query: { role: 'BOSS' }, status: 400 },
    { name: '[403] Nhân viên không xem được danh sách tài khoản', method: 'GET', path: '/admin/users', auth: 'staff', status: 403 },
    { name: '[403] Khách không xem được danh sách tài khoản', method: 'GET', path: '/admin/users', auth: 'customer', status: 403 },
    { name: '[401] Danh sách tài khoản khi chưa đăng nhập', method: 'GET', path: '/admin/users', status: 401 },

    // ───── GET /admin/users/:id ─────
    { name: '[200] Chi tiết tài khoản có số đơn và tổng chi', method: 'GET', path: '/admin/users/{{firstCustomerId}}', auth: 'manager', status: 200, expect: [{ path: 'phone', equals: '0922000001' }, { path: 'orderCount', exists: true }, { path: 'totalSpent', exists: true }, { path: 'passwordHash', exists: false }] },
    { name: '[404] Tài khoản không tồn tại', method: 'GET', path: '/admin/users/999999', auth: 'manager', status: 404 },
    { name: '[400] id không phải số', method: 'GET', path: '/admin/users/abc', auth: 'manager', status: 400 },
    { name: '[403] Nhân viên xem chi tiết tài khoản', method: 'GET', path: '/admin/users/{{firstCustomerId}}', auth: 'staff', status: 403 },

    // ───── PATCH /admin/users/:id/active ─────
    { name: '[200] Khóa tài khoản', method: 'PATCH', path: '/admin/users/{{userId}}/active', auth: 'manager', body: { isActive: false }, status: 200, expect: [{ path: 'isActive', equals: false }] },
    { name: '[403] Token cũ của tài khoản bị khóa bị từ chối ngay', method: 'GET', path: '/users/me', auth: 'user', status: 403 },
    { name: '[403] Tài khoản bị khóa không đăng nhập được', method: 'POST', path: '/auth/login', body: { phone: '{{phoneU}}', password: NEW_PW }, status: 403 },
    { name: '[200] Mở khóa tài khoản', method: 'PATCH', path: '/admin/users/{{userId}}/active', auth: 'manager', body: { isActive: true }, status: 200, expect: [{ path: 'isActive', equals: true }] },
    { name: '[200] Token cũ dùng lại được sau khi mở khóa', method: 'GET', path: '/users/me', auth: 'user', status: 200 },
    { name: '[422] Quản lý không tự khóa chính mình', method: 'PATCH', path: '/admin/users/{{managerId}}/active', auth: 'manager', body: { isActive: false }, status: 422 },
    { name: '[404] Khóa tài khoản không tồn tại', method: 'PATCH', path: '/admin/users/999999/active', auth: 'manager', body: { isActive: false }, status: 404 },
    { name: '[400] isActive không phải boolean', method: 'PATCH', path: '/admin/users/{{userId}}/active', auth: 'manager', body: { isActive: 'yes' }, status: 400 },
    { name: '[403] Nhân viên không khóa được tài khoản', method: 'PATCH', path: '/admin/users/{{userId}}/active', auth: 'staff', body: { isActive: false }, status: 403 },

    // ───── POST /admin/staff ─────
    { name: '[201] Quản lý tạo nhân viên', method: 'POST', path: '/admin/staff', auth: 'manager', set: { staffPhone: 'phone' }, body: { phone: '{{staffPhone}}', fullName: 'Nhân Viên Mới', password: PW }, status: 201, expect: [{ path: 'role', equals: 'STAFF' }, { path: 'isPhoneVerified', equals: true }, { path: 'passwordHash', exists: false }] },
    { name: '[200] Nhân viên mới đăng nhập được ngay (không cần OTP)', method: 'POST', path: '/auth/login', body: { phone: '{{staffPhone}}', password: PW }, status: 200, expect: [{ path: 'user.role', equals: 'STAFF' }] },
    { name: '[409] Số điện thoại đã dùng', method: 'POST', path: '/admin/staff', auth: 'manager', body: { phone: '{{staffPhone}}', fullName: 'Trùng', password: PW }, status: 409 },
    { name: '[409] Email đã dùng', method: 'POST', path: '/admin/staff', auth: 'manager', set: { staffPhone2: 'phone' }, body: { phone: '{{staffPhone2}}', fullName: 'Trùng email', password: PW, email: 'quanly@brewlite.vn' }, status: 409 },
    { name: '[400] Thiếu mật khẩu', method: 'POST', path: '/admin/staff', auth: 'manager', body: { phone: '{{staffPhone2}}', fullName: 'A' }, status: 400 },
    { name: '[400] Số điện thoại sai dạng', method: 'POST', path: '/admin/staff', auth: 'manager', body: { phone: '123', fullName: 'A', password: PW }, status: 400 },
    { name: '[403] Nhân viên không tạo được nhân viên', method: 'POST', path: '/admin/staff', auth: 'staff', body: { phone: '{{staffPhone2}}', fullName: 'A', password: PW }, status: 403 },
    { name: '[403] Khách không tạo được nhân viên', method: 'POST', path: '/admin/staff', auth: 'customer', body: { phone: '{{staffPhone2}}', fullName: 'A', password: PW }, status: 403 },
    { name: '[401] Tạo nhân viên khi chưa đăng nhập', method: 'POST', path: '/admin/staff', body: { phone: '{{staffPhone2}}', fullName: 'A', password: PW }, status: 401 },
  ],
};
export default folder;
