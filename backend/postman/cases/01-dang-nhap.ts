import { Case, Folder } from '../lib/dsl';

// Lấy token cho 4 vai trò dùng ở mọi folder sau. Luôn chạy đầu tiên (setup).
const login = (name: string, phone: string, tokenVar: string): Case => ({
  name: `Đăng nhập ${name}`,
  method: 'POST',
  path: '/auth/login',
  body: { phone, password: 'Brew@1234' },
  status: 200,
  save: { [tokenVar]: 'token' },
  expect: [{ path: 'token', exists: true }],
});

const folder: Folder = {
  name: '01 · Đăng nhập lấy token',
  description: 'Chạy trước các folder khác. Dùng tài khoản mẫu từ seed (mật khẩu Brew@1234).',
  setup: true,
  cases: [
    login('khách hàng 1', '0922000001', 'customerToken'),
    login('khách hàng 2', '0922000002', 'customer2Token'),
    login('nhân viên', '0911000001', 'staffToken'),
    login('quản lý', '0900000001', 'managerToken'),
  ],
};
export default folder;
