"""Dựng schema Prisma đề xuất từ RDM-01-BrewLite.md và các enum trong Class-01-MienDuLieu.md.
Dùng: python3 -I gen_prisma.py <thư mục docs> <file ra>"""
import re
import sys

docs, out = sys.argv[1], sys.argv[2]
rdm = open(f"{docs}/03-erd/RDM-01-BrewLite.md", encoding="utf8").read()
cls = open(f"{docs}/04-class/Class-01-MienDuLieu.md", encoding="utf8").read()


def pascal(s):
    return "".join(p.capitalize() for p in s.split("_"))


def lower_first(s):
    return s[0].lower() + s[1:]


enums = {}
for m in re.finditer(r"class (\w+) \{\s*<<enumeration>>\s*([\s\S]*?)\}", cls):
    enums[m.group(1)] = re.findall(r"^\s*(\w+)\s*$", m.group(2), re.M)

body = rdm.split("## Các bảng")[1].split("## Ràng buộc liên bảng")[0]
tables = []
for sec in re.split(r"^### ", body, flags=re.M)[1:]:
    head, *rows = sec.split("\n")
    name = re.match(r"(\w+)", head).group(1)
    t = {"name": name, "model": pascal(name), "cols": [], "uniques": []}
    for r in rows:
        m = re.match(r"^\| (.*?) \| (.*?) \| (.*?) \|$", r)
        if not m or m.group(1) in ("Cột", "---"):
            continue
        col, typ, con = m.groups()
        if not col.strip():
            u = re.match(r"UK \(([^)]*)\)", con)
            if u:
                t["uniques"].append([c.strip() for c in u.group(1).split(",")])
            continue
        for c in [c.strip() for c in col.split(",")]:
            t["cols"].append({"name": c, "type": typ.strip(), "con": con})
    tables.append(t)

by_name = {t["name"]: t for t in tables}
SCALAR = {"boolean": "Boolean", "text": "String", "timestamptz": "DateTime", "int": "Int", "serial": "Int"}


def prisma_type(typ):
    if typ in enums:
        return typ
    if typ in SCALAR:
        return SCALAR[typ]
    if re.match(r"(varchar|char)\(", typ):
        return "String"
    raise SystemExit(f"Kiểu chưa biết: {typ}")


def default_of(con, typ):
    m = re.search(r"mặc định `?([A-Za-z0-9_.]+)`?", con)
    if not m:
        return ""
    v = m.group(1)
    if re.fullmatch(r"\d{1,3}(\.\d{3})+", v):
        v = v.replace(".", "")  # 10.000 là mười nghìn
    if v == "now":
        return " @default(now())"
    if typ == "String":
        return f' @default("{v}")'
    return f" @default({v})"


backrefs = {t["name"]: [] for t in tables}
lines = ['generator client {', '  provider      = "prisma-client-js"',
         '  // alpine dùng musl + openssl 3 — phải khai báo để Prisma tải đúng engine',
         '  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]', '}', '',
         'datasource db {', '  provider = "postgresql"', '  url      = env("DATABASE_URL")', '}', '']
for name, vals in enums.items():
    lines += [f"enum {name} {{"] + [f"  {v}" for v in vals] + ["}", ""]

# gom quan hệ ngược trước để đặt tên không đụng nhau
for t in tables:
    for c in t["cols"]:
        fk = re.search(r"FK → (\w+)\.(\w+)", c["con"])
        if fk:
            c["fk"] = fk.groups()
            c["field"] = re.sub(r"Id$", "", c["name"]) if c["name"].endswith("Id") else c["name"] + "Rel"
            c["rel"] = f'{t["model"]}_{c["name"]}'
            c["one"] = bool(re.search(r"\bUK\b", c["con"])) and not t["uniques"]
            backrefs[fk.group(1)].append((t, c))

for t in tables:
    out_lines = [f'model {t["model"]} {{']
    pk_parts = [c["name"] for c in t["cols"] if "PK một phần" in c["con"]]
    for c in t["cols"]:
        typ = prisma_type(c["type"])
        con = c["con"]
        nullable = "null được" in con
        attrs = ""
        if c["type"] == "serial":
            attrs = " @id @default(autoincrement())"
        elif re.search(r"\bPK\b", con) and "PK một phần" not in con:
            attrs = " @id"
        if re.search(r"\bUK\b", con) and "PK" not in con:
            attrs += " @unique"
        attrs += default_of(con, typ)
        out_lines.append(f'  {c["name"]} {typ}{"?" if nullable else ""}{attrs}')
        if c.get("fk"):
            target = by_name[c["fk"][0]]
            cascade = ", onDelete: Cascade" if re.search(r"xóa theo", con) else ""
            out_lines.append(f'  {c["field"]} {target["model"]}{"?" if nullable else ""} @relation("{c["rel"]}", fields: [{c["name"]}], references: [{c["fk"][1]}]{cascade})')
    for r_t, r_c in backrefs[t["name"]]:
        base = lower_first(r_t["model"])
        same = [x for x in backrefs[t["name"]] if x[0]["name"] == r_t["name"]]
        fname = base if r_c.get("one") else base + "s"
        if len(same) > 1:
            fname = f'{base}By{r_c["name"][0].upper() + r_c["name"][1:]}' + ("" if r_c.get("one") else "s")
        out_lines.append(f'  {fname} {r_t["model"]}{"?" if r_c.get("one") else "[]"} @relation("{r_c["rel"]}")')
    if pk_parts:
        out_lines.append(f'  @@id([{", ".join(pk_parts)}])')
    for u in t["uniques"]:
        out_lines.append(f'  @@unique([{", ".join(u)}])')
    out_lines += [f'  @@map("{t["name"]}")', "}", ""]
    lines += out_lines

open(out, "w", encoding="utf8").write("\n".join(lines))
print(f"{len(tables)} bảng, {len(enums)} enum")
