// Chuyển các khối ```mermaid trong file .md thành file .drawio cùng tên (mỗi khối là một trang).
// Dùng: node md2drawio.mjs <thư mục docs>
// Cần: npm i mermaid@10.9.1 jsdom@24 (kèm dagre-d3-es có sẵn trong mermaid)
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
const dom = new JSDOM('<!DOCTYPE html><body></body>');
globalThis.window = dom.window; globalThis.document = dom.window.document;
const { default: mermaid } = await import('mermaid');
const dagre = await import('dagre-d3-es/src/dagre/index.js');
const graphlib = await import('dagre-d3-es/src/graphlib/index.js');
mermaid.initialize({ startOnLoad: false });

// esc: thoát ký tự cho thuộc tính XML. html: thoát ký tự rồi đổi xuống dòng thành <br> (dùng cho ô có html=1)
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '&#xa;');
const html = s => esc(String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
const CW = 6.6; // độ rộng ước lượng một ký tự ở cỡ chữ 11

function wrap(text, max) {
  const out = [];
  for (const para of String(text).replace(/<br\s*\/?>/g, '\n').split('\n')) {
    let line = '';
    for (const w of para.split(/\s+/)) {
      if (line && (line + ' ' + w).length > max) { out.push(line); line = w; } else line = line ? line + ' ' + w : w;
    }
    out.push(line);
  }
  return out;
}
const size = (text, max = 28, minW = 90) => {
  const lines = wrap(text, max);
  return { lines, w: Math.max(minW, Math.max(...lines.map(l => l.length)) * CW + 24), h: lines.length * 16 + 18 };
};

class Page {
  constructor(name) { this.name = name; this.cells = []; this.n = 2; }
  id() { return 'c' + (this.n++); }
  // rawHtml=true: value đã là html (đã thoát ký tự), chỉ cần thoát để nhúng vào thuộc tính XML
  vertex(value, style, x, y, w, h, parent = '1', rawHtml = false) {
    const id = this.id();
    const v = rawHtml ? value : /html=1/.test(style) ? html(value).replace(/\n/g, '<br>') : value;
    this.cells.push(`<mxCell id="${id}" value="${esc(v)}" style="${style}" vertex="1" parent="${parent}"><mxGeometry x="${Math.round(x)}" y="${Math.round(y)}" width="${Math.round(w)}" height="${Math.round(h)}" as="geometry"/></mxCell>`);
    return id;
  }
  edge(value, style, { source, target, points = [], sp, tp, parent = '1' }) {
    const id = this.id();
    const pts = points.map(p => `<mxPoint x="${Math.round(p.x)}" y="${Math.round(p.y)}"/>`).join('');
    const geo = `<mxGeometry relative="1" as="geometry">${sp ? `<mxPoint x="${Math.round(sp.x)}" y="${Math.round(sp.y)}" as="sourcePoint"/>` : ''}${tp ? `<mxPoint x="${Math.round(tp.x)}" y="${Math.round(tp.y)}" as="targetPoint"/>` : ''}${pts ? `<Array as="points">${pts}</Array>` : ''}</mxGeometry>`;
    this.cells.push(`<mxCell id="${id}" value="${esc(value)}" style="${style}" edge="1" parent="${parent}"${source ? ` source="${source}"` : ''}${target ? ` target="${target}"` : ''}>${geo}</mxCell>`);
    return id;
  }
  edgeLabel(edgeId, value, pos) {
    const id = this.id();
    this.cells.push(`<mxCell id="${id}" value="${esc(value)}" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=10;" vertex="1" connectable="0" parent="${edgeId}"><mxGeometry x="${pos}" relative="1" as="geometry"><mxPoint as="offset"/></mxGeometry></mxCell>`);
  }
  xml(idx) {
    return `<diagram id="p${idx}" name="${esc(this.name)}"><mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="0" pageScale="1" background="#FFFFFF" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${this.cells.join('')}</root></mxGraphModel></diagram>`;
  }
}

// ---------- bố cục chung bằng dagre ----------
function layout(nodes, edges, dir, opts = {}) {
  const g = new graphlib.Graph({ multigraph: true });
  g.setGraph({ rankdir: dir, nodesep: opts.nodesep ?? 50, ranksep: opts.ranksep ?? 70, marginx: 30, marginy: 30 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const n of nodes) g.setNode(n.id, { width: n.w, height: n.h });
  edges.forEach((e, i) => {
    const lab = e.label ? size(e.label, 22, 20) : null;
    g.setEdge(e.from, e.to, lab ? { width: lab.w, height: lab.h - 6, labelpos: 'c' } : {}, 'e' + i);
  });
  dagre.layout(g);
  return {
    pos: id => g.node(id),
    pts: i => { const e = edges[i]; return g.edge(e.from, e.to, 'e' + i).points.slice(1, -1); },
  };
}

// ---------- flowchart (activity, collaboration) ----------
function flowchart(db, page) {
  const V = db.getVertices(); const vs = V instanceof Map ? [...V.values()] : Object.values(V);
  const E = db.getEdges();
  const dir = ({ TB: 'TB', TD: 'TB', BT: 'BT', LR: 'LR', RL: 'RL' })[db.getDirection()] || 'TB';
  const nodes = vs.map(v => {
    const sz = v.type === 'circle' ? { lines: wrap(v.text, 16), w: 80, h: 44 } : size(v.text, v.type === 'diamond' ? 20 : 32, 110);
    if (v.type === 'diamond') { sz.w = sz.w * 1.5; sz.h = sz.h * 1.6; }
    return { v, id: v.id, ...sz };
  });
  const edges = E.map(e => ({ from: e.start, to: e.end, label: e.text, e }));
  const L = layout(nodes, edges, dir);
  const ids = {};
  for (const n of nodes) {
    const p = L.pos(n.id);
    const base = 'whiteSpace=wrap;html=1;fontSize=11;strokeColor=#333333;';
    const style = n.v.type === 'circle' ? base + 'ellipse;fillColor=#E8F0FE;' : n.v.type === 'diamond' ? base + 'rhombus;fillColor=#FFF4CC;' : base + 'rounded=1;arcSize=18;fillColor=#FFFFFF;';
    ids[n.id] = page.vertex(n.lines.join('\n'), style, p.x - n.w / 2, p.y - n.h / 2, n.w, n.h);
  }
  edges.forEach((e, i) => {
    const t = e.e;
    const dashed = t.stroke === 'dotted' ? 'dashed=1;' : '';
    const arrow = t.type === 'arrow_open' ? 'endArrow=none;' : 'endArrow=block;endFill=1;';
    page.edge(e.label || '', `html=1;fontSize=10;rounded=1;labelBackgroundColor=#FFFFFF;${dashed}${arrow}`, { source: ids[e.from], target: ids[e.to], points: L.pts(i) });
  });
}

// ---------- state ----------
function state(db, page) {
  db.extract?.(db.getRootDocV2());
  const S = db.getStates(); const sts = S instanceof Map ? [...S.values()] : Object.values(S);
  const rel = db.getRelations();
  const nodes = sts.map(s => {
    const label = s.descriptions?.length ? [s.id, ...s.descriptions].join('\n') : s.id;
    if (s.id.startsWith('root_start')) return { id: s.id, kind: 'start', w: 24, h: 24 };
    if (s.id.startsWith('root_end')) return { id: s.id, kind: 'end', w: 28, h: 28 };
    return { id: s.id, kind: 'state', label, ...size(label, 26, 110) };
  });
  const have = new Set(nodes.map(n => n.id));
  for (const r of rel) for (const id of [r.id1, r.id2]) if (!have.has(id)) { have.add(id); nodes.push({ id, kind: 'state', label: id, ...size(id, 26, 110) }); }
  const edges = rel.map(r => ({ from: r.id1, to: r.id2, label: r.relationTitle }));
  const L = layout(nodes, edges, 'TB', { ranksep: 80 });
  const ids = {};
  for (const n of nodes) {
    const p = L.pos(n.id);
    const style = n.kind === 'start' ? 'ellipse;html=1;fillColor=#000000;strokeColor=#000000;'
      : n.kind === 'end' ? 'ellipse;html=1;shape=doubleEllipse;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=2;'
        : 'rounded=1;arcSize=30;whiteSpace=wrap;html=1;fontSize=11;fillColor=#E8F0FE;strokeColor=#333333;';
    ids[n.id] = page.vertex(n.kind === 'state' ? (n.lines ?? [n.label]).join('\n') : '', style, p.x - n.w / 2, p.y - n.h / 2, n.w, n.h);
  }
  edges.forEach((e, i) => page.edge(e.label || '', 'html=1;fontSize=10;rounded=1;endArrow=block;endFill=1;labelBackgroundColor=#FFFFFF;', { source: ids[e.from], target: ids[e.to], points: L.pts(i) }));
}

// ---------- class ----------
const memberText = m => (typeof m === 'string' ? m : (m.getDisplayDetails ? m.getDisplayDetails().displayText : `${m.visibility ?? ''}${m.id}`));
function classDiagram(db, page) {
  const C = db.getClasses(); const cls = C instanceof Map ? [...C.values()] : Object.values(C);
  const rel = db.getRelations();
  const nodes = cls.map(c => {
    const attrs = (c.members || []).map(memberText);
    const meths = (c.methods || []).map(memberText);
    const ann = (c.annotations || []).map(a => `«${a}»`).join(' ');
    const title = c.label || c.id;
    const w = Math.max(150, Math.max(title.length, ...attrs.map(s => s.length), ...meths.map(s => s.length)) * 6.2 + 24);
    const hdr = ann ? 42 : 26;
    const h = hdr + Math.max(attrs.length, 1) * 15 + 6 + (meths.length ? meths.length * 15 + 6 : 0);
    return { id: c.id, title, attrs, meths, ann, w, h, hdr };
  });
  const have = new Set(nodes.map(n => n.id));
  const edges = rel.filter(r => have.has(r.id1) && have.has(r.id2)).map(r => ({ from: r.id1, to: r.id2, label: '', r }));
  // lớp không có quan hệ nào (enum, DTO rời) xếp thành lưới bên dưới để sơ đồ không bị kéo dài ngang
  const linked = new Set(edges.flatMap(e => [e.from, e.to]));
  const lone = nodes.filter(n => !linked.has(n.id)), conn = nodes.filter(n => linked.has(n.id));
  const L0 = layout(conn, edges, 'TB', { nodesep: 40, ranksep: 90 });
  const loneAt = {}; let gx = 40, gy = Math.max(0, ...conn.map(n => L0.pos(n.id).y + n.h / 2)) + 80, rowH = 0;
  for (const n of lone) { if (gx + n.w > 1900) { gx = 40; gy += rowH + 30; rowH = 0; } loneAt[n.id] = { x: gx + n.w / 2, y: gy + n.h / 2 }; gx += n.w + 30; rowH = Math.max(rowH, n.h); }
  const L = { pos: id => loneAt[id] ?? L0.pos(id), pts: L0.pts };
  const ids = {};
  const textStyle = 'text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;html=1;fontSize=10;whiteSpace=nowrap;';
  for (const n of nodes) {
    const p = L.pos(n.id); const x = p.x - n.w / 2, y = p.y - n.h / 2;
    const cid = page.vertex(n.ann ? `${n.ann}\n${n.title}` : n.title, `swimlane;fontStyle=1;horizontal=1;startSize=${n.hdr};collapsible=0;html=1;fontSize=11;fillColor=#DAE8FC;strokeColor=#333333;whiteSpace=wrap;`, x, y, n.w, n.h);
    ids[n.id] = cid;
    page.vertex(n.attrs.map(html).join('<br>') || ' ', textStyle, 0, n.hdr, n.w, Math.max(n.attrs.length, 1) * 15 + 6, cid, true);
    if (n.meths.length) page.vertex(n.meths.map(html).join('<br>'), textStyle + 'strokeColor=none;', 0, n.hdr + Math.max(n.attrs.length, 1) * 15 + 6, n.w, n.meths.length * 15 + 6, cid, true);
  }
  edges.forEach((e, i) => {
    const { type1, type2, lineType } = e.r.relation;
    const arrow = t => ({ 0: 'diamondThin;endFill=0', 1: 'block;endFill=0', 2: 'diamondThin;endFill=1', 3: 'open;endFill=0' })[t];
    let st = `html=1;fontSize=10;rounded=1;${lineType === 1 ? 'dashed=1;' : ''}`;
    st += arrow(type2) ? `endArrow=${arrow(type2)};` : 'endArrow=none;';
    st += arrow(type1) ? `startArrow=${arrow(type1).replace('endFill', 'startFill')};` : 'startArrow=none;';
    const id = page.edge(e.r.title || '', st + 'labelBackgroundColor=#FFFFFF;', { source: ids[e.from], target: ids[e.to], points: L.pts(i) });
    if (e.r.relationTitle1 && e.r.relationTitle1 !== 'none') page.edgeLabel(id, e.r.relationTitle1, -0.85);
    if (e.r.relationTitle2 && e.r.relationTitle2 !== 'none') page.edgeLabel(id, e.r.relationTitle2, 0.85);
  });
}

// ---------- ER ----------
function er(db, page) {
  const En = db.getEntities(); const ents = En instanceof Map ? [...En.entries()] : Object.entries(En);
  const rel = db.getRelationships();
  const nodes = ents.map(([name, e]) => {
    const rows = e.attributes.map(a => `${(a.attributeKeyTypeList || []).join(',').padEnd(6)} ${a.attributeType} ${a.attributeName}${a.attributeComment ? '  — ' + a.attributeComment : ''}`);
    const w = Math.max(190, Math.max(name.length, ...rows.map(r => r.length)) * 6 + 30);
    return { id: name, rows, w, h: 26 + rows.length * 16 + 4 };
  });
  const edges = rel.map(r => ({ from: r.entityA, to: r.entityB, r }));
  const L = layout(nodes, edges, 'TB', { nodesep: 50, ranksep: 90 });
  const ids = {};
  for (const n of nodes) {
    const p = L.pos(n.id); const x = p.x - n.w / 2, y = p.y - n.h / 2;
    const cid = page.vertex(n.id, 'swimlane;fontStyle=1;startSize=26;html=1;fontSize=11;fillColor=#DAE8FC;strokeColor=#333333;collapsible=0;', x, y, n.w, n.h);
    ids[n.id] = cid;
    page.vertex(n.rows.map(r => html(r).replace(/ /g, '&nbsp;')).join('<br>'), 'text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;overflow=hidden;html=1;fontSize=10;whiteSpace=nowrap;fontFamily=Courier New;', 0, 26, n.w, n.h - 26, cid, true);
  }
  // cardA nằm ở phía thực thể B (đầu mũi tên), cardB nằm ở phía thực thể A (đầu gốc)
  const card = { ZERO_OR_MORE: 'ERzeroToMany', ONE_OR_MORE: 'ERoneToMany', ONLY_ONE: 'ERmandOne', ZERO_OR_ONE: 'ERzeroToOne' };
  edges.forEach((e, i) => {
    const s = e.r.relSpec;
    page.edge(e.r.roleA || '', `html=1;fontSize=10;rounded=1;startArrow=${card[s.cardB]};endArrow=${card[s.cardA]};startFill=0;endFill=0;labelBackgroundColor=#FFFFFF;${s.relType === 'NON_IDENTIFYING' ? 'dashed=1;' : ''}`, { source: ids[e.from], target: ids[e.to], points: L.pts(i) });
  });
}

// ---------- sequence ----------
function sequence(db, page) {
  const A = db.getActors(); const actors = A instanceof Map ? [...A.values()] : Object.values(A);
  const msgs = db.getMessages();
  const idx = Object.fromEntries(actors.map((a, i) => [a.name, i]));
  const gaps = actors.slice(1).map(() => 170);
  const ARROWS = [0, 1, 3, 4, 5, 6, 24, 25];
  const MAXC = 52;
  const need = (a, b, w) => { if (a === b) return; const [i, j] = a < b ? [a, b] : [b, a]; const cur = gaps.slice(i, j).reduce((s, g) => s + g, 0); if (cur < w) for (let k = i; k < j; k++) gaps[k] += (w - cur) / (j - i); };
  for (const m of msgs) if (ARROWS.includes(m.type) && m.from !== m.to) need(idx[m.from], idx[m.to], Math.max(...wrap(m.message, MAXC).map(l => l.length)) * CW + 40);
  const xs = [90]; for (const g of gaps) xs.push(xs.at(-1) + g);
  const total = xs.at(-1) + 90;
  const hdrY = 20, hdrH = 40, top = hdrY + hdrH;
  let y = top + 24, auto = false, counter = 0;
  const stack = [];
  const body = [];
  for (const m of msgs) {
    const t = m.type;
    if (t === 26) { auto = !!m.message?.visible; continue; }
    if ([10, 12, 15].includes(t)) { stack.push({ kind: { 10: 'loop', 12: 'alt', 15: 'opt' }[t], label: m.message, y, depth: stack.length }); y += 30; continue; }
    if (t === 13) { const b = stack.at(-1); const yy = y; body.push(() => { page.edge('', 'endArrow=none;dashed=1;html=1;strokeColor=#666666;', { sp: { x: 14 + b.depth * 8, y: yy - 10 }, tp: { x: total - 14 - b.depth * 8, y: yy - 10 } }); page.vertex(`[${m.message}]`, 'text;html=1;fontSize=10;align=left;strokeColor=none;fillColor=none;', 20 + b.depth * 8, yy - 8, 360, 18); }); y += 26; continue; }
    if ([11, 14, 16].includes(t)) {
      const b = stack.pop(); const y0 = b.y, y1 = y;
      body.unshift(() => {
        page.vertex('', 'rounded=0;html=1;fillColor=none;strokeColor=#666666;', 14 + b.depth * 8, y0 - 6, total - 28 - b.depth * 16, y1 - y0 + 4);
        page.vertex(b.kind, 'shape=umlFrame;html=1;whiteSpace=wrap;fontSize=10;width=40;height=18;fillColor=#EEEEEE;strokeColor=#666666;', 14 + b.depth * 8, y0 - 6, 40, 18);
        if (b.label) page.vertex(`[${b.label}]`, 'text;html=1;fontSize=10;align=left;strokeColor=none;fillColor=none;', 58 + b.depth * 8, y0 - 6, 500, 18);
      });
      y += 14; continue;
    }
    if (t === 2) { // ghi chú
      const lines = wrap(m.message, 44); const w = Math.max(...lines.map(l => l.length)) * CW + 20, h = lines.length * 15 + 12;
      const a = idx[m.from], b = idx[m.to ?? m.from], yy = y;
      const cx = m.placement === 2 ? (xs[a] + xs[b]) / 2 : m.placement === 0 ? xs[a] - w / 2 - 14 : xs[a] + w / 2 + 14;
      body.push(() => page.vertex(lines.join('\n'), 'shape=note;size=8;whiteSpace=wrap;html=1;fontSize=10;fillColor=#FFF2CC;strokeColor=#999999;align=left;spacingLeft=4;', cx - w / 2, yy, w, h));
      y += h + 14; continue;
    }
    if (ARROWS.includes(t)) {
      if (auto) counter++;
      const label = (auto ? `${counter}. ` : '') + m.message; const lines = wrap(label, MAXC);
      const yy = y + (lines.length - 1) * 14;
      const a = xs[idx[m.from]], b = xs[idx[m.to]];
      const dashed = [1, 4, 6, 25].includes(t) ? 'dashed=1;' : '';
      const open = [5, 6].includes(t) ? 'endArrow=open;endFill=0;' : t === 3 || t === 4 ? 'endArrow=cross;' : 'endArrow=block;endFill=1;';
      const lw = Math.max(...lines.map(l => l.length)) * CW + 10;
      if (m.from === m.to) {
        body.push(() => {
          page.edge('', `html=1;rounded=0;${dashed}${open}`, { sp: { x: a, y: yy }, tp: { x: a, y: yy + 22 }, points: [{ x: a + 45, y: yy }, { x: a + 45, y: yy + 22 }] });
          page.vertex(lines.join('\n'), 'text;html=1;fontSize=10;align=left;whiteSpace=wrap;strokeColor=none;fillColor=none;', a + 50, yy - 4, lw, lines.length * 15 + 4);
        });
        y += lines.length * 14 + 40;
      } else {
        body.push(() => {
          page.edge('', `html=1;${dashed}${open}`, { sp: { x: a, y: yy }, tp: { x: b, y: yy } });
          page.vertex(lines.join('\n'), 'text;html=1;fontSize=10;align=center;verticalAlign=bottom;whiteSpace=wrap;strokeColor=none;fillColor=none;', Math.min(a, b) + 6, yy - lines.length * 15 - 2, Math.abs(b - a) - 12, lines.length * 15 + 2);
        });
        y += lines.length * 14 + 26;
      }
    }
  }
  const bottom = y + 10;
  actors.forEach((a, i) => {
    page.edge('', 'endArrow=none;dashed=1;html=1;strokeColor=#999999;', { sp: { x: xs[i], y: top }, tp: { x: xs[i], y: bottom } });
    if (a.type === 'actor') page.vertex(a.description || a.name, 'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fontSize=11;', xs[i] - 15, hdrY - 8, 30, 52);
    else page.vertex(a.description || a.name, 'rounded=0;whiteSpace=wrap;html=1;fontSize=11;fillColor=#DAE8FC;strokeColor=#333333;', xs[i] - 65, hdrY, 130, hdrH);
  });
  for (const f of body) f();
}

const handlers = { flowchart, 'flowchart-v2': flowchart, stateDiagram: state, classDiagram, er, sequence };

// ---------- BFD và use case (dựng từ bảng trong BFD-BrewLite.md, UseCase-BrewLite.md) ----------
const fileOf = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const stripMd = s => s.replace(/\*\*/g, '').replace(/`/g, '').trim();

function genBfd(root) {
  const md = fileOf(root, '01-bfd/BFD-BrewLite.md');
  const groups = {}; for (const m of md.matchAll(/G(\d+)\[\d+ ([^\]]+)\]/g)) groups[m[1]] = { n: m[1], name: m[2], leaves: [] };
  for (const m of md.matchAll(/^\| (\d+)\.(\d+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/gm)) {
    const extra = /bổ sung ngoài BFD gốc/.test(m[3]);
    groups[m[1]].leaves.push({ code: `${m[1]}.${m[2]}`, name: stripMd(m[3]).replace(/\s*—\s*bổ sung ngoài BFD gốc/, ''), ucs: stripMd(m[4]), sys: /Bước hệ thống/.test(m[5]), extra });
  }
  const list = Object.values(groups);
  const pages = [];
  // trang tổng quan: cây gốc -> phân hệ -> nhóm
  {
    const p = new Page('BFD Tổng quan');
    const nodes = [{ id: 'R', w: 360, h: 56, t: 'HỆ THỐNG ĐẶT ĐỒ UỐNG TRỰC TUYẾN BREWLITE', st: 'rounded=0;fillColor=#FFFFFF;strokeWidth=2;fontStyle=1;fontSize=13;' }, { id: 'KH', w: 260, h: 48, t: 'PHÂN HỆ KHÁCH HÀNG', st: 'rounded=0;fillColor=#DAE8FC;strokeWidth=2;fontStyle=1;' }, { id: 'QT', w: 260, h: 48, t: 'PHÂN HỆ QUẢN TRỊ', st: 'rounded=0;fillColor=#D5E8D4;strokeWidth=2;fontStyle=1;' }];
    const edges = [{ from: 'R', to: 'KH' }, { from: 'R', to: 'QT' }];
    for (const g of list) { const kh = +g.n <= 7; nodes.push({ id: 'G' + g.n, w: 170, h: 56, t: `${g.n} ${g.name}`, st: `rounded=0;fillColor=${kh ? '#DAE8FC' : '#D5E8D4'};` }); edges.push({ from: kh ? 'KH' : 'QT', to: 'G' + g.n }); }
    const L = layout(nodes, edges, 'TB', { nodesep: 24, ranksep: 70 }); const ids = {};
    for (const n of nodes) { const q = L.pos(n.id); ids[n.id] = p.vertex(n.t, `whiteSpace=wrap;html=1;fontSize=11;strokeColor=#333333;${n.st}`, q.x - n.w / 2, q.y - n.h / 2, n.w, n.h); }
    edges.forEach(e => p.edge('', 'html=1;endArrow=none;edgeStyle=orthogonalEdgeStyle;', { source: ids[e.from], target: ids[e.to] }));
    pages.push(p);
  }
  for (const [title, ns, fill] of [['BFD Khách hàng', list.filter(g => +g.n <= 7), '#DAE8FC'], ['BFD Quản trị', list.filter(g => +g.n > 7), '#D5E8D4']]) {
    const p = new Page(title); let x = 30;
    for (const g of ns) {
      const hdr = p.vertex(`${g.n} ${g.name}`, `whiteSpace=wrap;html=1;fontSize=12;fontStyle=1;strokeColor=#333333;strokeWidth=2;fillColor=${fill};`, x, 30, 280, 48);
      g.leaves.forEach((l, i) => {
        const id = p.vertex(`${l.code} ${l.name}\n${l.ucs}${l.sys ? ' · bước hệ thống' : ''}${l.extra ? ' · bổ sung' : ''}`, `whiteSpace=wrap;html=1;fontSize=10;align=left;spacingLeft=6;strokeColor=#333333;${l.sys ? 'dashed=1;' : ''}fillColor=${l.extra ? '#FFE6CC' : '#FFFFFF'};`, x + 30, 100 + i * 58, 250, 48);
        p.edge('', 'html=1;endArrow=none;edgeStyle=orthogonalEdgeStyle;exitX=0.06;exitY=1;entryX=0;entryY=0.5;', { source: hdr, target: id });
      });
      x += 310;
    }
    pages.push(p);
  }
  return pages;
}

// nhóm trang phân rã theo mã UC (PR1–PR14), khớp cột "Trang phân rã" trong UseCase-BrewLite.md
const PR = [['PR1 Tài khoản', 'UC01-06,68'], ['PR2 Xem menu', 'UC07-10'], ['PR3 Thêm vào giỏ', 'UC11-14'], ['PR4 Sửa giỏ hàng', 'UC15-17'], ['PR5 Đặt hàng', 'UC18-20'], ['PR6 Thanh toán', 'UC21-23'], ['PR7 Theo dõi đơn', 'UC24-29,70-72'], ['PR8 QL sản phẩm', 'UC39-47,76-77'], ['PR9 QL danh mục', 'UC48-51'], ['PR10 QL topping', 'UC52-55'], ['PR11 QL đơn hàng', 'UC30-38,73,74'], ['PR12 QL khuyến mãi', 'UC56-59,69'], ['PR13 QL người dùng', 'UC60-63,75'], ['PR14 Thống kê', 'UC64-67']];
const expandUc = spec => spec.split(',').flatMap(t => { const m = t.replace(/UC/g, '').split('-'); const a = +m[0], b = +(m[1] ?? m[0]); return Array.from({ length: b - a + 1 }, (_, i) => 'UC' + String(a + i).padStart(2, '0')); });
const SMS = ['UC01', 'UC18', 'UC22', 'UC34', 'UC35'], MAIL = ['UC18', 'UC22', 'UC34', 'UC35'];

function genUseCase(root) {
  const md = fileOf(root, '02-use_case/UseCase-BrewLite.md');
  const ucs = {};
  for (const m of md.matchAll(/^\| (UC\d+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/gm)) ucs[m[1]] = { id: m[1], name: stripMd(m[2]).replace(/\s*\(bổ sung ngoài BFD gốc\)/, '').replace(/\s*\(hình gọi là[^)]*\)/, ''), actor: m[3].split(',')[0].trim() };
  const rels = [];
  const sec3 = md.split('## 3.')[1].split('## 4.')[0];
  for (const m of sec3.matchAll(/^\| (include|extend) \| ([^|]+) \| ([^|]+) \|/gm)) for (const a of m[2].match(/UC\d+/g)) for (const b of m[3].match(/UC\d+/g)) rels.push({ type: m[1], a, b });
  const pages = [];
  for (const [name, spec] of PR) {
    const p = new Page(name); const mine = expandUc(spec);
    const nodes = [], edges = [], kinds = {};
    const addUc = (u, ext) => { if (kinds[u]) return; kinds[u] = 1; const sz = size(`${u} ${ucs[u].name}`, 22, 130); nodes.push({ id: u, w: sz.w * 1.25, h: sz.h * 1.4, lines: sz.lines, ext }); };
    mine.forEach(u => addUc(u, false));
    const myRels = rels.filter(r => mine.includes(r.a) || mine.includes(r.b));
    myRels.forEach(r => { addUc(r.a, !mine.includes(r.a)); addUc(r.b, !mine.includes(r.b)); });
    const actors = new Set();
    for (const u of mine) { const a = ucs[u].actor; actors.add(a); edges.push({ from: 'A:' + a, to: u, kind: 'assoc' }); }
    for (const u of mine) {
      if (SMS.includes(u)) { actors.add('Cổng SMS (mock)'); edges.push({ from: u, to: 'A:Cổng SMS (mock)', kind: 'assoc' }); }
      if (MAIL.includes(u)) { actors.add('Dịch vụ email'); edges.push({ from: u, to: 'A:Dịch vụ email', kind: 'assoc' }); }
      if (u === 'UC22') { actors.add('Cổng thanh toán (mock)'); edges.push({ from: u, to: 'A:Cổng thanh toán (mock)', kind: 'assoc' }); }
    }
    myRels.forEach(r => edges.push({ from: r.a, to: r.b, kind: r.type }));
    for (const a of actors) nodes.push({ id: 'A:' + a, w: 90, h: 70, actor: a });
    if (actors.has('Khách hàng') && actors.has('Khách vãng lai')) edges.push({ from: 'A:Khách hàng', to: 'A:Khách vãng lai', kind: 'gen' });
    if (actors.has('Quản lý') && actors.has('Nhân viên')) edges.push({ from: 'A:Quản lý', to: 'A:Nhân viên', kind: 'gen' });
    const L = layout(nodes, edges.map(e => ({ ...e, label: e.kind === 'include' ? '«include»' : e.kind === 'extend' ? '«extend»' : '' })), 'LR', { nodesep: 36, ranksep: 110 }); const ids = {};
    const ucNodes = nodes.filter(n => !n.actor);
    const bx0 = Math.min(...ucNodes.map(n => L.pos(n.id).x - n.w / 2)) - 24, bx1 = Math.max(...ucNodes.map(n => L.pos(n.id).x + n.w / 2)) + 24;
    const by0 = Math.min(...ucNodes.map(n => L.pos(n.id).y - n.h / 2)) - 40, by1 = Math.max(...ucNodes.map(n => L.pos(n.id).y + n.h / 2)) + 24;
    p.vertex(name.replace(/^PR\d+ /, 'Hệ thống BrewLite — '), 'rounded=0;html=1;fillColor=none;strokeColor=#666666;verticalAlign=top;align=left;spacingLeft=8;fontStyle=1;fontSize=11;', bx0, by0, bx1 - bx0, by1 - by0);
    for (const n of nodes) {
      const q = L.pos(n.id);
      ids[n.id] = n.actor ? p.vertex(n.actor, 'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fontSize=11;', q.x - 15, q.y - 30, 30, 56)
        : p.vertex(n.lines.join('\n'), `ellipse;whiteSpace=wrap;html=1;fontSize=10;strokeColor=${n.ext ? '#999999' : '#333333'};fillColor=${n.ext ? '#F5F5F5' : '#FFFFFF'};${n.ext ? 'dashed=1;' : ''}`, q.x - n.w / 2, q.y - n.h / 2, n.w, n.h);
    }
    for (const e of edges) {
      const st = { assoc: 'endArrow=none;', include: 'endArrow=open;dashed=1;', extend: 'endArrow=open;dashed=1;', gen: 'endArrow=block;endFill=0;' }[e.kind];
      p.edge(e.kind === 'include' ? '«include»' : e.kind === 'extend' ? '«extend»' : '', `html=1;fontSize=10;labelBackgroundColor=#FFFFFF;${st}`, { source: ids[e.from], target: ids[e.to] });
    }
    pages.push(p);
  }
  // tổng quan: tác nhân nối tới từng trang phân rã
  const p = new Page('Use case tổng quan');
  const prs = PR.map(([n, spec], i) => ({ id: 'P' + i, name: n, ucs: expandUc(spec) }));
  const nodes = [], edges = [];
  for (const a of ['Khách vãng lai', 'Khách hàng', 'Nhân viên', 'Quản lý']) nodes.push({ id: 'A:' + a, w: 90, h: 70, actor: a });
  for (const q of prs) {
    const sz = size(`${q.name}\n${q.ucs.length} use case`, 26, 150); nodes.push({ id: q.id, w: sz.w, h: sz.h + 12, lines: sz.lines });
    for (const a of new Set(q.ucs.map(u => ucs[u].actor))) edges.push({ from: 'A:' + a, to: q.id, kind: 'assoc' });
  }
  edges.push({ from: 'A:Khách hàng', to: 'A:Khách vãng lai', kind: 'gen' }, { from: 'A:Quản lý', to: 'A:Nhân viên', kind: 'gen' });
  for (const a of ['Cổng thanh toán (mock)', 'Cổng SMS (mock)', 'Dịch vụ email']) nodes.push({ id: 'A:' + a, w: 90, h: 70, actor: a });
  // PR1 (UC01), PR5 (UC18), PR6 (UC22), PR11 (UC34, UC35) dùng SMS hoặc email
  for (const [pr, a] of [['P5', 'Cổng thanh toán (mock)'], ['P0', 'Cổng SMS (mock)'], ['P4', 'Cổng SMS (mock)'], ['P4', 'Dịch vụ email'], ['P5', 'Cổng SMS (mock)'], ['P5', 'Dịch vụ email'], ['P10', 'Cổng SMS (mock)'], ['P10', 'Dịch vụ email']]) edges.push({ from: pr, to: 'A:' + a, kind: 'assoc' });
  const L = layout(nodes, edges, 'LR', { nodesep: 28, ranksep: 140 }); const ids = {};
  for (const n of nodes) {
    const q = L.pos(n.id);
    ids[n.id] = n.actor ? p.vertex(n.actor, 'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fontSize=11;', q.x - 15, q.y - 30, 30, 56)
      : p.vertex(n.lines.join('\n'), 'rounded=1;arcSize=20;whiteSpace=wrap;html=1;fontSize=10;strokeColor=#333333;fillColor=#E8F0FE;', q.x - n.w / 2, q.y - n.h / 2, n.w, n.h);
  }
  edges.forEach(e => p.edge('', `html=1;${e.kind === 'gen' ? 'endArrow=block;endFill=0;' : 'endArrow=none;'}`, { source: ids[e.from], target: ids[e.to] }));
  return { overview: [p], pr: pages };
}

const mxfile = pages => `<mxfile host="app.diagrams.net" pages="${pages.length}">${pages.map((p, i) => p.xml(i)).join('')}</mxfile>\n`;

// ---------- chạy ----------
const root = process.argv[2];
let files = 0, pages = 0, fail = 0;
for (const dir of fs.readdirSync(root).sort()) {
  const d = path.join(root, dir);
  if (!/^0[3-8]-/.test(dir) || !fs.statSync(d).isDirectory()) continue;
  for (const f of fs.readdirSync(d).sort()) {
    if (!f.endsWith('.md')) continue;
    const text = fs.readFileSync(path.join(d, f), 'utf8');
    const title = (text.match(/^# (.+)$/m) || [, f])[1];
    const blocks = [...text.matchAll(/```mermaid\n([\s\S]*?)```/g)];
    if (!blocks.length) continue;
    const out = [];
    for (let i = 0; i < blocks.length; i++) {
      const before = text.slice(0, blocks[i].index);
      const heading = [...before.matchAll(/^##+ (.+)$/gm)].at(-1)?.[1];
      const name = blocks.length === 1 ? title.replace(/^\d+ · /, '') : (heading ?? `Sơ đồ ${i + 1}`);
      const page = new Page(name.slice(0, 80));
      try {
        const diag = await mermaid.mermaidAPI.getDiagramFromText(blocks[i][1]);
        const h = handlers[diag.type]; if (!h) throw new Error('chưa hỗ trợ ' + diag.type);
        h(diag.db, page);
        out.push(page.xml(i)); pages++;
      } catch (e) { fail++; console.log(`LỖI ${dir}/${f} khối ${i + 1}: ${e.stack?.split('\n').slice(0, 3).join(' | ')}`); }
    }
    fs.writeFileSync(path.join(d, f.replace(/\.md$/, '.drawio')), `<mxfile host="app.diagrams.net" pages="${out.length}">${out.join('')}</mxfile>\n`);
    files++;
  }
}
fs.writeFileSync(path.join(root, '01-bfd/BFD-BrewLite.drawio'), mxfile(genBfd(root)));
{
  const uc = genUseCase(root);
  fs.writeFileSync(path.join(root, '02-use_case/UseCase-BrewLite.drawio'), mxfile(uc.overview));
  fs.writeFileSync(path.join(root, '02-use_case/UseCase-PhanRa-BrewLite.drawio'), mxfile(uc.pr));
}
console.log(`Đã tạo ${files} file .drawio, ${pages} trang, lỗi ${fail}`);
