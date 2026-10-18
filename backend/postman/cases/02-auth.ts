import { Folder } from '../lib/dsl';

const PW = 'Matkhau123';
const NEW_PW = 'MatkhauMoi456';
const GENERIC = 'Nếu số này đã đăng ký thì mã xác thực đã được gửi.';

// OTP dev luôn là 123456. Chạy backend với OTP_RESEND_SECONDS=2 để chạy lại test liên tục mà không vướng giới hạn 60 giây.
const folder: Folder = {
  name: '02 · Xác thực (auth)',
  description: 'UC01 đăng ký + OTP, UC02 đăng nhập, UC03 đăng xuất, UC68 quên mật khẩu.',
  cases: [
    // ───── Đăng ký ─────
    { name: '[201] Đăng ký thành công', method: 'POST', path: '/auth/register', set: { phone: 'phone', email: 'email' }, body: { phone: '{{phone}}', password: PW, fullName: 'Khách Thử Nghiệm', email: '{{email}}' }, status: 201, expect: [{ path: 'message', exists: true }] },
    { name: '[422] Gửi lại OTP ngay sau khi vừa gửi (chưa đủ thời gian chờ)', method: 'POST', path: '/auth/resend-otp', body: { phone: '{{phone}}' }, status: 422 },
    { name: '[400] Đăng ký thiếu số điện thoại', method: 'POST', path: '/auth/register', body: { password: PW, fullName: 'A' }, status: 400 },
    { name: '[400] Số điện thoại sai dạng', method: 'POST', path: '/auth/register', body: { phone: '12345', password: PW, fullName: 'A' }, status: 400 },
    { name: '[400] Số điện thoại có chữ', method: 'POST', path: '/auth/register', body: { phone: '09ab567890', password: PW, fullName: 'A' }, status: 400 },
    { name: '[400] Mật khẩu dưới 8 ký tự', method: 'POST', path: '/auth/register', set: { phone2: 'phone' }, body: { phone: '{{phone2}}', password: '1234567', fullName: 'A' }, status: 400 },
    { name: '[400] Họ tên rỗng', method: 'POST', path: '/auth/register', body: { phone: '{{phone2}}', password: PW, fullName: '   ' }, status: 400 },
    { name: '[400] Email sai dạng', method: 'POST', path: '/auth/register', body: { phone: '{{phone2}}', password: PW, fullName: 'A', email: 'khong-phai-email' }, status: 400 },
    { name: '[409] Số điện thoại đã đăng ký', method: 'POST', path: '/auth/register', body: { phone: '0922000001', password: PW, fullName: 'A' }, status: 409 },
    { name: '[409] Email đã được dùng', method: 'POST', path: '/auth/register', body: { phone: '{{phone2}}', password: PW, fullName: 'A', email: 'khach1@example.com' }, status: 409 },

    // ───── Xác thực OTP ─────
    { name: '[400] Mã OTP không đủ 6 chữ số', method: 'POST', path: '/auth/verify-otp', body: { phone: '{{phone}}', code: '12345' }, status: 400 },
    { name: '[400] Mã OTP có chữ', method: 'POST', path: '/auth/verify-otp', body: { phone: '{{phone}}', code: '12ab56' }, status: 400 },
    { name: '[422] Sai mã OTP', method: 'POST', path: '/auth/verify-otp', body: { phone: '{{phone}}', code: '000000' }, status: 422 },
    { name: '[422] Số chưa đăng ký (chưa có OTP)', method: 'POST', path: '/auth/verify-otp', body: { phone: '{{phone2}}', code: '123456' }, status: 422 },
    { name: '[403] Chưa xác thực OTP thì không đăng nhập được', method: 'POST', path: '/auth/login', body: { phone: '{{phone}}', password: PW }, status: 403 },
    { name: '[200] Xác thực OTP đúng, nhận token', method: 'POST', path: '/auth/verify-otp', body: { phone: '{{phone}}', code: '123456' }, status: 200, save: { newUserToken: 'token' }, expect: [{ path: 'token', exists: true }, { path: 'user.isPhoneVerified', equals: true }, { path: 'user.role', equals: 'CUSTOMER' }, { path: 'user.passwordHash', exists: false }] },
    { name: '[409] Xác thực lại tài khoản đã xác thực', method: 'POST', path: '/auth/verify-otp', body: { phone: '{{phone}}', code: '123456' }, status: 409 },

    // Nhập sai quá 5 lần thì mã mất hiệu lực dù sau đó nhập đúng
    { name: '[201] Đăng ký tài khoản để thử khóa OTP', method: 'POST', path: '/auth/register', set: { phone3: 'phone' }, body: { phone: '{{phone3}}', password: PW, fullName: 'Khách OTP' }, status: 201 },
    ...[1, 2, 3, 4, 5].map((n) => ({ name: `[422] Nhập sai OTP lần ${n}`, method: 'POST' as const, path: '/auth/verify-otp', body: { phone: '{{phone3}}', code: '999999' }, status: 422 })),
    { name: '[422] Sau 5 lần sai, nhập đúng mã vẫn bị từ chối', method: 'POST', path: '/auth/verify-otp', body: { phone: '{{phone3}}', code: '123456' }, status: 422 },

    // ───── Gửi lại OTP ─────
    { name: '[400] Gửi lại OTP với số sai dạng', method: 'POST', path: '/auth/resend-otp', body: { phone: 'abc' }, status: 400 },
    { name: '[404] Gửi lại OTP cho số chưa đăng ký', method: 'POST', path: '/auth/resend-otp', body: { phone: '{{phone2}}' }, status: 404 },
    { name: '[409] Gửi lại OTP cho số đã xác thực', method: 'POST', path: '/auth/resend-otp', body: { phone: '{{phone}}' }, status: 409 },
    { name: '[200] Gửi lại OTP cho tài khoản chưa xác thực (seed 0933000001)', method: 'POST', path: '/auth/resend-otp', body: { phone: '0933000001' }, status: 200 },
    { name: '[422] Gửi lại liên tiếp bị giới hạn thời gian chờ', method: 'POST', path: '/auth/resend-otp', body: { phone: '0933000001' }, status: 422 },

    // ───── Đăng nhập ─────
    { name: '[200] Đăng nhập thành công', method: 'POST', path: '/auth/login', body: { phone: '{{phone}}', password: PW }, status: 200, expect: [{ path: 'token', matches: '^eyJ' }, { path: 'user.phone', exists: true }, { path: 'user.passwordHash', exists: false }] },
    { name: '[200] Quản lý đăng nhập được, có role MANAGER', method: 'POST', path: '/auth/login', body: { phone: '0900000001', password: 'Brew@1234' }, status: 200, expect: [{ path: 'user.role', equals: 'MANAGER' }] },
    { name: '[400] Đăng nhập số sai dạng', method: 'POST', path: '/auth/login', body: { phone: '123', password: PW }, status: 400 },
    { name: '[400] Đăng nhập thiếu mật khẩu', method: 'POST', path: '/auth/login', body: { phone: '{{phone}}' }, status: 400 },
    { name: '[401] Sai mật khẩu', method: 'POST', path: '/auth/login', body: { phone: '{{phone}}', password: 'saimatkhau' }, status: 401 },
    { name: '[401] Số điện thoại chưa đăng ký', method: 'POST', path: '/auth/login', body: { phone: '{{phone2}}', password: PW }, status: 401 },
    { name: '[403] Tài khoản bị khóa (seed 0922000058)', method: 'POST', path: '/auth/login', body: { phone: '0922000058', password: 'Brew@1234' }, status: 403 },
    { name: '[403] Tài khoản chưa xác thực OTP (seed 0933000001)', method: 'POST', path: '/auth/login', body: { phone: '0933000001', password: 'Brew@1234' }, status: 403 },

    // ───── Quên mật khẩu ─────
    { name: '[400] Quên mật khẩu với số sai dạng', method: 'POST', path: '/auth/forgot-password', body: { phone: '12' }, status: 400 },
    { name: '[200] Quên mật khẩu, số đã đăng ký', method: 'POST', path: '/auth/forgot-password', body: { phone: '{{phone}}' }, status: 200, expect: [{ path: 'message', equals: GENERIC }] },
    { name: '[422] Xin mã lần nữa ngay lập tức', method: 'POST', path: '/auth/forgot-password', body: { phone: '{{phone}}' }, status: 422 },
    { name: '[200] Quên mật khẩu, số chưa đăng ký (trả lời y hệt, không lộ)', method: 'POST', path: '/auth/forgot-password', body: { phone: '{{phone2}}' }, status: 200, expect: [{ path: 'message', equals: GENERIC }] },
    { name: '[400] Đặt lại mật khẩu: mật khẩu mới ngắn', method: 'POST', path: '/auth/reset-password', body: { phone: '{{phone}}', code: '123456', newPassword: '123' }, status: 400 },
    { name: '[400] Đặt lại mật khẩu: mã không đủ 6 số', method: 'POST', path: '/auth/reset-password', body: { phone: '{{phone}}', code: '12', newPassword: NEW_PW }, status: 400 },
    { name: '[422] Đặt lại mật khẩu: sai mã', method: 'POST', path: '/auth/reset-password', body: { phone: '{{phone}}', code: '000000', newPassword: NEW_PW }, status: 422 },
    { name: '[422] Đặt lại mật khẩu: số chưa đăng ký', method: 'POST', path: '/auth/reset-password', body: { phone: '{{phone2}}', code: '123456', newPassword: NEW_PW }, status: 422 },
    { name: '[200] Đặt lại mật khẩu thành công', method: 'POST', path: '/auth/reset-password', body: { phone: '{{phone}}', code: '123456', newPassword: NEW_PW }, status: 200 },
    { name: '[422] Dùng lại mã vừa dùng', method: 'POST', path: '/auth/reset-password', body: { phone: '{{phone}}', code: '123456', newPassword: NEW_PW }, status: 422 },
    { name: '[200] Đăng nhập bằng mật khẩu mới', method: 'POST', path: '/auth/login', body: { phone: '{{phone}}', password: NEW_PW }, status: 200 },
    { name: '[401] Mật khẩu cũ không còn dùng được', method: 'POST', path: '/auth/login', body: { phone: '{{phone}}', password: PW }, status: 401 },

    // ───── Đăng xuất ─────
    { name: '[401] Đăng xuất khi chưa đăng nhập', method: 'POST', path: '/auth/logout', status: 401 },
    { name: '[401] Đăng xuất với token sai', method: 'POST', path: '/auth/logout', auth: 'expired', status: 401 },
    { name: '[200] Đăng xuất thành công', method: 'POST', path: '/auth/logout', auth: 'newUser', status: 200 },
    { name: '[401] Token đã đăng xuất bị thu hồi, không dùng lại được', method: 'POST', path: '/auth/logout', auth: 'newUser', status: 401 },
  ],
};
export default folder;
