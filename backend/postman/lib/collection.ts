import { Case, EXPIRED_TOKEN, Folder } from './dsl';

// Sinh collection Postman v2.1. Script kiểm tra viết bằng JS của Postman, tương đương checkValue() trong dsl.ts.

const HELPERS = `
const get = (o, p) => p === '' ? o : p.split('.').reduce((c, k) => (c == null ? undefined : c[k]), o);
let json; try { json = pm.response.json(); } catch (e) { json = undefined; }
`;

const GEN_SCRIPT = `
const digits = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');
const gen = {
  phone: () => '0988' + digits(6),
  email: () => 'test' + digits(8) + '@example.com',
  uuid: () => 'key-' + Date.now() + '-' + digits(6),
  code: () => 'T' + digits(8),
};
`;

function genExpr(kind: string): string {
  if (kind.startsWith('isoDays:')) return `new Date(Date.now() + ${Number(kind.split(':')[1])} * 86400000).toISOString()`;
  return `gen.${kind}()`;
}

function testScript(c: Case): string[] {
  const lines = [HELPERS, `pm.test(${JSON.stringify(`HTTP ${c.status}`)}, () => pm.response.to.have.status(${c.status}));`];
  for (const k of c.expect ?? []) {
    const p = JSON.stringify(k.path);
    const label = JSON.stringify(`${k.path || '(body)'}`);
    if (k.exists !== undefined) lines.push(`pm.test(${label} + ' ${k.exists ? 'có' : 'không có'}', () => pm.expect(get(json, ${p}) != null).to.eql(${k.exists}));`);
    if (k.isArray !== undefined) lines.push(`pm.test(${label} + ' ${k.isArray ? 'là mảng' : 'không là mảng'}', () => pm.expect(Array.isArray(get(json, ${p}))).to.eql(${k.isArray}));`);
    if (k.equals !== undefined) lines.push(`pm.test(${label} + ' bằng ' + ${JSON.stringify(JSON.stringify(k.equals))}, () => pm.expect(get(json, ${p})).to.eql(${JSON.stringify(k.equals)}));`);
    if (k.min !== undefined) lines.push(`pm.test(${label} + ' >= ${k.min}', () => { const v = get(json, ${p}); pm.expect(Array.isArray(v) ? v.length : Number(v)).to.be.at.least(${k.min}); });`);
    if (k.matches !== undefined) lines.push(`pm.test(${label} + ' khớp regex', () => pm.expect(String(get(json, ${p}))).to.match(new RegExp(${JSON.stringify(k.matches)})));`);
  }
  for (const [name, p] of Object.entries(c.save ?? {})) lines.push(`pm.collectionVariables.set(${JSON.stringify(name)}, get(json, ${JSON.stringify(p)}));`);
  return lines;
}

// "@x" nguyên giá trị -> {{x}} không bọc nháy, để số và boolean giữ đúng kiểu trong JSON
function bodyRaw(body: unknown): string {
  return JSON.stringify(body, null, 2).replace(/"@(\w+)"/g, '{{$1}}');
}

function item(c: Case) {
  const header = [] as { key: string; value: string }[];
  if (c.body !== undefined) header.push({ key: 'Content-Type', value: 'application/json' });
  if (c.auth) header.push({ key: 'Authorization', value: `Bearer {{${c.auth}Token}}` });
  for (const [key, value] of Object.entries(c.headers ?? {})) header.push({ key, value });
  const query = Object.entries(c.query ?? {}).map(([key, value]) => ({ key, value: String(value) }));
  const qs = query.length ? '?' + query.map((q) => `${q.key}=${encodeURIComponent(q.value)}`).join('&') : '';
  const pre = Object.entries(c.set ?? {}).map(([name, kind]) => `pm.collectionVariables.set(${JSON.stringify(name)}, ${genExpr(kind)});`);
  const event: unknown[] = [{ listen: 'test', script: { type: 'text/javascript', exec: testScript(c) } }];
  if (pre.length) event.unshift({ listen: 'prerequest', script: { type: 'text/javascript', exec: [GEN_SCRIPT, ...pre] } });
  return {
    name: c.name,
    event,
    request: {
      method: c.method,
      header,
      url: { raw: `{{baseUrl}}${c.path}${qs}`, host: ['{{baseUrl}}'], path: c.path.split('/').filter(Boolean), query },
      ...(c.body !== undefined ? { body: { mode: 'raw', raw: bodyRaw(c.body), options: { raw: { language: 'json' } } } } : {}),
    },
  };
}

export function buildCollection(folders: Folder[]) {
  return {
    info: {
      name: 'BrewLite API',
      description: 'Sinh tự động bằng `npm run postman:build` từ backend/postman/cases. Đừng sửa tay, hãy sửa file case rồi build lại.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: folders.map((f) => ({ name: f.name, description: f.description, item: f.cases.map(item) })),
  };
}

export function buildEnvironment() {
  const keys = ['customerToken', 'customer2Token', 'staffToken', 'managerToken'];
  return {
    name: 'BrewLite local',
    values: [
      { key: 'baseUrl', value: 'http://localhost:3001', enabled: true },
      { key: 'expiredToken', value: EXPIRED_TOKEN, enabled: true },
      ...keys.map((key) => ({ key, value: '', enabled: true })),
    ],
    _postman_variable_scope: 'environment',
  };
}
