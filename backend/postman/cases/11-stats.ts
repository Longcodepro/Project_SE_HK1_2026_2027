import { Case, Folder } from '../lib/dsl';

const guard = (path: string): Case[] => [
  { name: `[403] Nhân viên không xem được ${path}`, method: 'GET', path, auth: 'staff', status: 403 },
  { name: `[403] Khách không xem được ${path}`, method: 'GET', path, auth: 'customer', status: 403 },
  { name: `[401] ${path} khi chưa đăng nhập`, method: 'GET', path, status: 401 },
];

// Khoảng ngày chắc chắn không có đơn nào
const EMPTY = { from: '2020-01-01T00:00:00.000Z', to: '2020-01-07T23:59:59.000Z' };

const folder: Folder = {
  name: '11 · Thống kê (stats)',
  description: 'UC64 doanh thu, UC65 món bán chạy, UC66 topping bán chạy, UC67 số đơn theo trạng thái. Chỉ quản lý.',
  cases: [
    // ───── Doanh thu ─────
    { name: '[200] Doanh thu 30 ngày gần nhất theo ngày', method: 'GET', path: '/admin/stats/revenue', auth: 'manager', status: 200, expect: [{ path: 'groupBy', equals: 'day' }, { path: 'totalRevenue', min: 1 }, { path: 'orderCount', min: 1 }, { path: 'averageOrderValue', min: 1 }, { path: 'series', isArray: true, min: 30 }, { path: 'series.0.period', matches: '^\\d{4}-\\d{2}-\\d{2}$' }, { path: 'series.0.revenue', exists: true }] },
    { name: '[200] Doanh thu theo tháng', method: 'GET', path: '/admin/stats/revenue', auth: 'manager', query: { groupBy: 'month', from: '2026-08-01T00:00:00.000Z' }, status: 200, expect: [{ path: 'groupBy', equals: 'month' }, { path: 'series', isArray: true, min: 3 }, { path: 'series.0.period', matches: '^\\d{4}-\\d{2}$' }, { path: 'totalRevenue', min: 1 }] },
    { name: '[200] Khoảng không có đơn: doanh thu 0 nhưng vẫn đủ các ngày', method: 'GET', path: '/admin/stats/revenue', auth: 'manager', query: EMPTY, status: 200, expect: [{ path: 'totalRevenue', equals: 0 }, { path: 'orderCount', equals: 0 }, { path: 'averageOrderValue', equals: 0 }, { path: 'series', isArray: true, min: 7 }, { path: 'series.0.revenue', equals: 0 }] },
    { name: '[400] Ngày bắt đầu sau ngày kết thúc', method: 'GET', path: '/admin/stats/revenue', auth: 'manager', query: { from: '2026-10-10T00:00:00.000Z', to: '2026-10-01T00:00:00.000Z' }, status: 400 },
    { name: '[400] Nhóm theo không hợp lệ', method: 'GET', path: '/admin/stats/revenue', auth: 'manager', query: { groupBy: 'year' }, status: 400 },
    { name: '[400] Ngày không đúng định dạng', method: 'GET', path: '/admin/stats/revenue', auth: 'manager', query: { from: 'hôm qua' }, status: 400 },
    { name: '[400] Theo ngày nhưng khoảng dài hơn 366 ngày', method: 'GET', path: '/admin/stats/revenue', auth: 'manager', query: { from: '2020-01-01T00:00:00.000Z', to: '2026-01-01T00:00:00.000Z', groupBy: 'day' }, status: 400 },
    ...guard('/admin/stats/revenue'),

    // ───── Món bán chạy ─────
    { name: '[200] 10 món bán chạy nhất mặc định', method: 'GET', path: '/admin/stats/top-products', auth: 'manager', status: 200, expect: [{ path: 'items', isArray: true, min: 10 }, { path: 'items.9', exists: true }, { path: 'items.10', exists: false }, { path: 'items.0.name', exists: true }, { path: 'items.0.totalCups', min: 1 }, { path: 'items.0.revenue', min: 1 }] },
    { name: '[200] Giới hạn 3 món', method: 'GET', path: '/admin/stats/top-products', auth: 'manager', query: { limit: 3 }, status: 200, expect: [{ path: 'items.2', exists: true }, { path: 'items.3', exists: false }] },
    { name: '[200] Khoảng không có đơn thì danh sách rỗng', method: 'GET', path: '/admin/stats/top-products', auth: 'manager', query: EMPTY, status: 200, expect: [{ path: 'items', equals: [] }] },
    { name: '[400] limit bằng 0', method: 'GET', path: '/admin/stats/top-products', auth: 'manager', query: { limit: 0 }, status: 400 },
    { name: '[400] limit vượt 50', method: 'GET', path: '/admin/stats/top-products', auth: 'manager', query: { limit: 51 }, status: 400 },
    { name: '[400] limit không phải số', method: 'GET', path: '/admin/stats/top-products', auth: 'manager', query: { limit: 'nhiều' }, status: 400 },
    { name: '[400] Ngày bắt đầu sau ngày kết thúc', method: 'GET', path: '/admin/stats/top-products', auth: 'manager', query: { from: '2026-10-10T00:00:00.000Z', to: '2026-10-01T00:00:00.000Z' }, status: 400 },
    ...guard('/admin/stats/top-products'),

    // ───── Topping bán chạy ─────
    { name: '[200] Topping được chọn nhiều nhất', method: 'GET', path: '/admin/stats/top-toppings', auth: 'manager', query: { limit: 5 }, status: 200, expect: [{ path: 'items', isArray: true, min: 5 }, { path: 'items.0.name', exists: true }, { path: 'items.0.totalPortions', min: 1 }, { path: 'items.5', exists: false }] },
    { name: '[200] Khoảng không có đơn thì danh sách rỗng', method: 'GET', path: '/admin/stats/top-toppings', auth: 'manager', query: EMPTY, status: 200, expect: [{ path: 'items', equals: [] }] },
    { name: '[400] limit vượt 50', method: 'GET', path: '/admin/stats/top-toppings', auth: 'manager', query: { limit: 99 }, status: 400 },
    ...guard('/admin/stats/top-toppings'),

    // ───── Số đơn theo trạng thái ─────
    { name: '[200] Đủ 7 trạng thái, kể cả trạng thái không có đơn', method: 'GET', path: '/admin/stats/orders-by-status', auth: 'manager', query: { from: '2020-01-01T00:00:00.000Z' }, status: 200, expect: [{ path: 'total', min: 340 }, { path: 'counts.PENDING', exists: true }, { path: 'counts.PAID', exists: true }, { path: 'counts.PAYMENT_FAILED', exists: true }, { path: 'counts.PREPARING', exists: true }, { path: 'counts.READY', exists: true }, { path: 'counts.COMPLETED', min: 200 }, { path: 'counts.CANCELLED', min: 1 }] },
    { name: '[200] Khoảng không có đơn: cả 7 trạng thái đều bằng 0', method: 'GET', path: '/admin/stats/orders-by-status', auth: 'manager', query: EMPTY, status: 200, expect: [{ path: 'total', equals: 0 }, { path: 'counts.PENDING', equals: 0 }, { path: 'counts.COMPLETED', equals: 0 }, { path: 'counts.CANCELLED', equals: 0 }] },
    { name: '[400] Ngày bắt đầu sau ngày kết thúc', method: 'GET', path: '/admin/stats/orders-by-status', auth: 'manager', query: { from: '2026-10-10T00:00:00.000Z', to: '2026-10-01T00:00:00.000Z' }, status: 400 },
    ...guard('/admin/stats/orders-by-status'),
  ],
};
export default folder;
