import { Case, EXPIRED_TOKEN, Folder, checkValue, generate, getPath } from './dsl';

export interface RunOptions {
  base: string;
  only?: string; // chỉ chạy folder có tên chứa chuỗi này (folder setup vẫn chạy trước)
}

type Vars = Record<string, unknown>;

const sub = (s: string, vars: Vars) => s.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ''));

// "@x" nguyên giá trị giữ nguyên kiểu, "{{x}}" nội suy chuỗi
function resolveBody(v: unknown, vars: Vars): unknown {
  if (typeof v === 'string') {
    const whole = /^@(\w+)$/.exec(v);
    return whole ? vars[whole[1]] : sub(v, vars);
  }
  if (Array.isArray(v)) return v.map((x) => resolveBody(x, vars));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, resolveBody(x, vars)]));
  return v;
}

async function runCase(c: Case, vars: Vars, base: string): Promise<string[]> {
  for (const [name, kind] of Object.entries(c.set ?? {})) vars[name] = generate(kind);
  const qs = c.query ? '?' + new URLSearchParams(Object.entries(c.query).map(([k, v]) => [k, String(v)])).toString() : '';
  const headers: Record<string, string> = {};
  if (c.body !== undefined) headers['Content-Type'] = 'application/json';
  if (c.auth) headers.Authorization = `Bearer ${vars[`${c.auth}Token`] ?? ''}`;
  for (const [k, v] of Object.entries(c.headers ?? {})) headers[k] = sub(v, vars);

  const res = await fetch(base + sub(c.path, vars) + qs, {
    method: c.method,
    headers,
    body: c.body !== undefined ? JSON.stringify(resolveBody(c.body, vars)) : undefined,
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = undefined;
  }

  const errors: string[] = [];
  if (res.status !== c.status) errors.push(`HTTP ${res.status}, mong ${c.status}: ${text.slice(0, 200)}`);
  for (const k of c.expect ?? []) {
    const e = checkValue(getPath(json, k.path), k);
    if (e) errors.push(e);
  }
  for (const [name, p] of Object.entries(c.save ?? {})) vars[name] = getPath(json, p);
  return errors;
}

export async function runFolders(folders: Folder[], opts: RunOptions): Promise<boolean> {
  const vars: Vars = { baseUrl: opts.base, expiredToken: EXPIRED_TOKEN };
  const selected = folders.filter((f) => f.setup || !opts.only || f.name.toLowerCase().includes(opts.only.toLowerCase()));
  let pass = 0;
  const failed: string[] = [];
  for (const f of selected) {
    console.log(`\n▶ ${f.name}`);
    for (const c of f.cases) {
      let errors: string[];
      try {
        errors = await runCase(c, vars, opts.base);
      } catch (e) {
        errors = [`lỗi gọi API: ${(e as Error).message}`];
      }
      if (errors.length === 0) {
        pass++;
        console.log(`  ✓ ${c.name}`);
      } else {
        failed.push(`${f.name} › ${c.name}`);
        console.log(`  ✗ ${c.name}`);
        errors.forEach((e) => console.log(`      ${e}`));
      }
    }
  }
  console.log(`\nKết quả: ${pass} đạt, ${failed.length} lỗi, tổng ${pass + failed.length} case`);
  failed.forEach((n) => console.log(`  - ${n}`));
  return failed.length === 0;
}
