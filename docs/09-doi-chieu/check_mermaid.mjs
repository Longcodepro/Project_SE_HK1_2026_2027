import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
const dom = new JSDOM('<!DOCTYPE html><body></body>');
globalThis.window = dom.window; globalThis.document = dom.window.document;
const { default: mermaid } = await import('mermaid');
mermaid.initialize({ startOnLoad: false });
const root = process.argv[2];
let total=0, bad=0;
for (const dir of fs.readdirSync(root)) {
  const d = path.join(root, dir);
  if (!fs.statSync(d).isDirectory()) continue;
  for (const f of fs.readdirSync(d)) {
    if (!f.endsWith('.md')) continue;
    const t = fs.readFileSync(path.join(d,f),'utf8');
    const blocks = [...t.matchAll(/```mermaid\n([\s\S]*?)```/g)];
    let i=0;
    for (const b of blocks) {
      i++; total++;
      try { await mermaid.parse(b[1]); }
      catch(e) { bad++; console.log(`LỖI ${dir}/${f} khối ${i}: ${String(e.message||e).split('\n').slice(0,4).join(' | ')}`); }
    }
  }
}
console.log(`Đã kiểm ${total} sơ đồ Mermaid, lỗi ${bad}`);
