import { Folder } from '../lib/dsl';

const folder: Folder = {
  name: '00 · Sức khỏe hệ thống',
  cases: [
    { name: 'Trang chủ API', method: 'GET', path: '/', status: 200, expect: [{ path: 'status', equals: 'ok' }] },
    { name: 'Health check', method: 'GET', path: '/health', status: 200, expect: [{ path: 'status', equals: 'ok' }] },
    { name: '[404] Đường dẫn không tồn tại', method: 'GET', path: '/khong-co-duong-dan-nay', status: 404 },
  ],
};
export default folder;
