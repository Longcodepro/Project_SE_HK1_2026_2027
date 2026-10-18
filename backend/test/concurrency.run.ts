// Kiểm thử đồng thời (T2, T3, T8 trong kế hoạch kiểm thử): bắn nhiều request cùng lúc vào backend đang chạy.
// Dùng: npm run test:concurrency   (cần backend và Postgres đang chạy, đã seed)
const BASE = process.env.BASE_URL ?? 'http://localhost:3001';

type Res = { status: number; json: any };
async function api(method: string, path: string, opts: { token?: string; body?: unknown; headers?: Record<string, string> } = {}): Promise<Res> {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(opts.token && { Authorization: `Bearer ${opts.token}` }), ...opts.headers },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : undefined };
}

const digits = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');
const line = (over: Record<string, unknown> = {}) => ({ productId: 1, sizeCode: 'M', iceLevel: 50, sugarLevel: 50, temperature: 'COLD', quantity: 1, ...over });

async function login(phone: string, password = 'Brew@1234') {
  return (await api('POST', '/auth/login', { body: { phone, password } })).json.token as string;
}
async function newCustomer() {
  const phone = '0977' + digits(6);
  await api('POST', '/auth/register', { body: { phone, password: 'Matkhau123', fullName: 'Khách Đồng Thời' } });
  const { json } = await api('POST', '/auth/verify-otp', { body: { phone, code: '123456' } });
  return json.token as string;
}

let failed = 0;
function check(name: string, ok: boolean, detail = '') {
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : ` — ${detail}`}`);
  if (!ok) failed++;
}
const count = (rs: Res[], status: number) => rs.filter((r) => r.status === status).length;

async function main() {
  const manager = await login('0900000001');

  console.log('\n▶ T2 · Cùng Idempotency-Key gửi đồng thời chỉ thanh toán một lần (BR10)');
  {
    const token = await newCustomer();
    const order = (await api('POST', '/orders', { token, body: { items: [line()] } })).json;
    const key = 'concurrent-' + digits(8);
    const rs = await Promise.all(Array.from({ length: 6 }, () => api('POST', '/payments', { token, headers: { 'Idempotency-Key': key }, body: { orderId: order.id, method: 'EWALLET' } })));
    const ids = new Set(rs.map((r) => r.json?.payment?.id));
    const detail = (await api('GET', `/orders/${order.id}`, { token })).json;
    check('cả 6 request đều trả 201', count(rs, 201) === 6, rs.map((r) => r.status).join(','));
    check('chỉ có đúng một giao dịch', ids.size === 1 && detail.payments.length === 1, `ids=${[...ids]}, payments=${detail.payments.length}`);
    check('đơn PAID một lần, điểm cộng một lần', detail.status === 'PAID' && detail.pointsAwarded === 30, `status=${detail.status}, points=${detail.pointsAwarded}`);
    await api('POST', `/orders/${order.id}/cancel`, { token, body: {} });
  }

  console.log('\n▶ T3 · Nhiều khách đặt đồng thời món chỉ còn 1 ly (BR49, BR50)');
  {
    const product = (await api('POST', '/admin/products', { token: manager, body: { categoryId: 1, name: 'Món thử đồng thời', sizes: [{ sizeCode: 'M', price: 20000 }] } })).json;
    await api('PUT', `/admin/products/${product.id}/daily-stock`, { token: manager, body: { quantity: 1 } });
    const tokens = await Promise.all(Array.from({ length: 8 }, () => newCustomer()));
    const rs = await Promise.all(tokens.map((token) => api('POST', '/orders', { token, body: { items: [line({ productId: product.id })] } })));
    const after = (await api('GET', `/products/${product.id}`)).json;
    check('đúng một đơn thành công', count(rs, 201) === 1, rs.map((r) => r.status).join(','));
    check('các đơn còn lại bị từ chối 422', count(rs, 422) === 7, rs.map((r) => r.status).join(','));
    check('số ly còn lại bằng 0, không âm', after.remainingToday === 0, `remainingToday=${after.remainingToday}`);
    const winner = rs.findIndex((r) => r.status === 201);
    if (winner >= 0) await api('POST', `/orders/${rs[winner].json.id}/cancel`, { token: tokens[winner], body: {} });
    await api('PATCH', `/admin/products/${product.id}/lock`, { token: manager, body: { isLocked: true } });
  }

  console.log('\n▶ T8a · Hai khách cùng dùng lượt cuối của một mã khuyến mãi (BR39, BR53)');
  {
    const code = 'CC' + digits(8);
    const promo = (await api('POST', '/admin/promotions', { token: manager, body: { code, discountType: 'FIXED', discountValue: 5000, maxTotalUses: 1, startsAt: new Date(Date.now() - 86400000).toISOString(), endsAt: new Date(Date.now() + 86400000 * 30).toISOString() } })).json;
    const tokens = await Promise.all(Array.from({ length: 4 }, () => newCustomer()));
    const rs = await Promise.all(tokens.map((token) => api('POST', '/orders', { token, body: { items: [line()], promotionCode: code } })));
    check('đúng một đơn dùng được mã', count(rs, 201) === 1, rs.map((r) => r.status).join(','));
    check('các đơn còn lại bị từ chối 422', count(rs, 422) === 3, rs.map((r) => r.status).join(','));
    for (let i = 0; i < rs.length; i++) if (rs[i].status === 201) await api('POST', `/orders/${rs[i].json.id}/cancel`, { token: tokens[i], body: {} });
    await api('PATCH', `/admin/promotions/${promo.id}/deactivate`, { token: manager });
  }

  console.log('\n▶ T8b · Nhiều yêu cầu rút tiền cùng lúc vượt số dư ví (BR44, BR53)');
  {
    const token = await newCustomer();
    const order = (await api('POST', '/orders', { token, body: { items: [line()] } })).json;
    await api('POST', '/payments', { token, headers: { 'Idempotency-Key': 'w-' + digits(8) }, body: { orderId: order.id, method: 'EWALLET' } });
    await api('POST', `/orders/${order.id}/cancel`, { token, body: {} }); // hoàn 32.000đ vào ví
    const withdraw = () => api('POST', '/wallet/withdrawals', { token, body: { amount: 20000, destinationType: 'EWALLET', accountName: 'NGUYEN VAN A', accountNumber: '0901234567' } });
    const rs = await Promise.all(Array.from({ length: 5 }, withdraw));
    const wallet = (await api('GET', '/wallet', { token })).json;
    check('đúng một yêu cầu thành công', count(rs, 201) === 1, rs.map((r) => r.status).join(','));
    check('các yêu cầu còn lại bị từ chối 422', count(rs, 422) === 4, rs.map((r) => r.status).join(','));
    check('số dư ví còn 12.000đ, không âm', wallet.balance === 12000, `balance=${wallet.balance}`);
  }

  console.log(failed === 0 ? '\nTất cả kiểm thử đồng thời đạt' : `\n${failed} kiểm thử đồng thời lỗi`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
