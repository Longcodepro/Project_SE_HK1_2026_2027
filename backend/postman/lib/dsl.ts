// Mô tả test endpoint một lần, dùng cho cả hai việc:
//  1) sinh collection Postman (build.ts)  2) chạy test thẳng từ dòng lệnh (run.ts)

export type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

// Kiểm tra một giá trị trong JSON trả về. path rỗng là cả body, "items.0.id" là đường dẫn lồng nhau.
export interface Check {
  path: string;
  equals?: unknown;
  exists?: boolean;
  isArray?: boolean;
  min?: number; // giá trị số phải >= min (hoặc độ dài mảng nếu là mảng)
  matches?: string; // regex áp lên giá trị dạng chuỗi
}

// Sinh giá trị mới ngay trước khi gọi, để chạy lại nhiều lần không bị trùng dữ liệu
export type Gen = 'phone' | 'email' | 'uuid' | 'code' | `isoDays:${number}`;

export interface Case {
  name: string;
  method: Method;
  // Có thể chứa {{biến}}. Biến lấy từ môi trường, từ `set` hoặc từ `save` của case trước.
  path: string;
  // Tên vai trò: dùng biến <auth>Token làm Bearer. Bỏ trống là không gửi token.
  auth?: string; // customer, customer2, staff, manager, expired hoặc tên biến token tự lưu bằng `save`
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean>;
  // Trong body: "{{x}}" chèn biến dạng chuỗi, "@x" chèn biến nguyên giá trị (số, boolean)
  body?: unknown;
  status: number;
  expect?: Check[];
  save?: Record<string, string>; // tên biến -> đường dẫn trong JSON trả về
  set?: Record<string, Gen>; // tên biến -> kiểu giá trị tự sinh
}

export interface Folder {
  name: string;
  description?: string;
  // Folder đăng nhập lấy token: luôn chạy trước khi chạy riêng một folder khác
  setup?: boolean;
  cases: Case[];
}

// Token sai chữ ký, dùng để test 401 "token không hợp lệ"
export const EXPIRED_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImV4cCI6MX0.invalid';

// ───── Hàm dùng chung ─────

export function getPath(obj: unknown, path: string): unknown {
  if (path === '') return obj;
  return path.split('.').reduce<unknown>((cur, key) => (cur == null ? undefined : (cur as any)[key]), obj);
}

export function generate(kind: Gen): string {
  const digits = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');
  if (kind === 'phone') return '0988' + digits(6);
  if (kind === 'email') return `test${digits(8)}@example.com`;
  if (kind === 'uuid') return `key-${Date.now()}-${digits(6)}`;
  if (kind === 'code') return 'T' + digits(8);
  const days = Number(kind.split(':')[1]);
  return new Date(Date.now() + days * 86400000).toISOString();
}

export function checkValue(value: unknown, c: Check): string | null {
  const label = c.path || '(body)';
  if (c.exists !== undefined && (value !== undefined && value !== null) !== c.exists) return `${label}: ${c.exists ? 'phải có' : 'không được có'}`;
  if (c.isArray !== undefined && Array.isArray(value) !== c.isArray) return `${label}: ${c.isArray ? 'phải là mảng' : 'không được là mảng'}`;
  if (c.equals !== undefined && JSON.stringify(value) !== JSON.stringify(c.equals)) return `${label}: mong ${JSON.stringify(c.equals)}, nhận ${JSON.stringify(value)}`;
  if (c.min !== undefined) {
    const n = Array.isArray(value) ? value.length : Number(value);
    if (!(n >= c.min)) return `${label}: mong >= ${c.min}, nhận ${n}`;
  }
  if (c.matches !== undefined && !new RegExp(c.matches).test(String(value))) return `${label}: "${value}" không khớp /${c.matches}/`;
  return null;
}
