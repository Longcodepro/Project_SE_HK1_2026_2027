"""Kiểm tra các sơ đồ markdown trong docs/ có khớp nhau không.

Chạy:  python3 docs/09-doi-chieu/check_consistency.py
Thoát mã 1 nếu có lỗi. Chỉ dùng thư viện chuẩn.
"""
import re
import sys
from pathlib import Path

DOCS = Path(__file__).resolve().parents[1]
errors = []


def read(p):
    return p.read_text(encoding="utf-8")


def files(folder):
    return sorted((DOCS / folder).glob("*.md"))


# ---------- 1. Lớp và hàm (nguồn: Class-02, Class-03) ----------
classes = {}
for f in files("04-class"):
    for name, body in re.findall(r"class (\w+) \{(.*?)\n  \}", read(f), re.S):
        # lấy cả hàm, thuộc tính (+kiểu tên) và giá trị enum
        classes[name] = set(re.findall(r"^[ \t]*[+\-#]?(?:\S+[ \t]+)?(\w+)(?:\(|[ \t]*$)", body, re.M))

# ---------- 2. Route (nguồn: bảng route ở Class-02) ----------
route_re = re.compile(r"`(GET|POST|PUT|PATCH|DELETE) (/[^`\s]*?)(?:\?[^`]*)?`")
routes = set(route_re.findall(read(DOCS / "04-class" / "Class-02-DichVu.md")))


def norm(path):
    return path.split("?")[0].rstrip("/")


routes = {(m, norm(p)) for m, p in routes}

# ---------- 3. Sequence: mỗi thông điệp tới lớp phải là hàm có thật ----------
msg_re = re.compile(r"^\s*(\w+)->>\+?(\w+):\s*(.+?)\s*$")
n_msg = 0
called = set()  # (lớp, hàm) đã được sơ đồ nào đó gọi tới
for f in files("05-sequence"):
    for i, line in enumerate(read(f).splitlines(), 1):
        m = msg_re.match(line)
        if not m:
            continue
        target, text = m.group(2), m.group(3)
        rt = re.match(r"(GET|POST|PUT|PATCH|DELETE) (\S+)", text)
        if rt:
            n_msg += 1
            if (rt.group(1), norm(rt.group(2))) not in routes:
                errors.append(f"{f.name}:{i} route không có trong Class-02: {text}")
            continue
        if target in classes:
            fn = re.match(r"(\w+)\(", text)
            n_msg += 1
            if not fn:
                errors.append(f"{f.name}:{i} thông điệp tới {target} không phải hàm: {text}")
            elif fn.group(1) not in classes[target]:
                errors.append(f"{f.name}:{i} {target}.{fn.group(1)} không có trong sơ đồ lớp")
            else:
                called.add((target, fn.group(1)))

# ---------- 4. Collaboration: nhãn n: hàm(...) ----------
node_re = re.compile(r'^\s*(\w+)\[":(\w+)"\]', re.M)
edge_re = re.compile(r'(\w+) -->\|"([\d.]+): (\w+)\(.*?\)"\| (\w+)')
for f in files("08-collaboration"):
    text = read(f)
    nodes = dict(node_re.findall(text))
    for src, num, fn, dst in edge_re.findall(text):
        cls = nodes.get(dst)
        n_msg += 1
        if cls in classes and fn not in classes[cls]:
            errors.append(f"{f.name} thông điệp {num}: {cls}.{fn} không có trong sơ đồ lớp")
        elif cls in classes:
            called.add((cls, fn))

# ---------- 4b. Hàm backend/frontend nào chưa sơ đồ nào gọi tới ----------
# Hàm có trong Class-02 hoặc Class-03 mà không sequence/collaboration nào gọi = còn thiếu sơ đồ.
for f in (DOCS / "04-class" / "Class-02-DichVu.md", DOCS / "04-class" / "Class-03-GiaoDien.md"):
    for name, body in re.findall(r"class (\w+) \{(.*?)\n  \}", read(f), re.S):
        for fn in re.findall(r"^[ \t]*[+\-#]?(\w+)\(", body, re.M):
            if (name, fn) not in called:
                errors.append(f"{name}.{fn} có trong sơ đồ lớp nhưng sequence/collaboration nào cũng không gọi")

# ---------- 5. Mọi token Lớp.hàm trong tài liệu phải có thật ----------
tok = re.compile(r"\b([A-Z]\w*)\.(\w+)\b")
for folder in ["01-bfd", "02-use_case", "03-erd", "04-class", "05-sequence", "06-state",
               "07-activity", "08-collaboration", "09-doi-chieu"]:
    for f in files(folder):
        for i, line in enumerate(read(f).splitlines(), 1):
            for cls, fn in tok.findall(line):
                if cls in classes and fn not in classes[cls]:
                    errors.append(f"{f.name}:{i} {cls}.{fn} không có trong sơ đồ lớp")

# ---------- 6. Use case: phủ BFD và phủ sequence ----------
uc_all = set(re.findall(r"^\| (UC\d\d) \|", read(DOCS / "02-use_case" / "UseCase-BrewLite.md"), re.M))
if len(uc_all) != 77:
    errors.append(f"UseCase-BrewLite.md có {len(uc_all)} UC, kỳ vọng 77")


def expand(text):
    found = set(re.findall(r"UC\d\d", text))
    for a, b in re.findall(r"UC(\d\d)\s*(?:–|-|đến)\s*(?:UC)?(\d\d)", text):
        found |= {f"UC{n:02d}" for n in range(int(a), int(b) + 1)}
    return found


bfd = read(DOCS / "01-bfd" / "BFD-BrewLite.md")
bfd_uc = expand(bfd)
for uc in sorted(uc_all - bfd_uc):
    errors.append(f"{uc} không xuất hiện trong BFD-BrewLite.md")
for uc in sorted(bfd_uc - uc_all):
    errors.append(f"BFD nhắc {uc} nhưng UseCase-BrewLite.md không có")
bfd_codes = re.findall(r"^\| (\d+\.\d+) \|", bfd, re.M)
if len(bfd_codes) != 80:
    errors.append(f"BFD-BrewLite.md có {len(bfd_codes)} chức năng lá, kỳ vọng 80 (70 gốc + 10 bổ sung)")

seq_uc = set()
for f in files("05-sequence"):
    seq_uc |= expand(read(f))
for uc in sorted(uc_all - seq_uc):
    errors.append(f"{uc} chưa xuất hiện ở sequence nào")

for folder in ["04-class", "05-sequence", "06-state", "07-activity", "08-collaboration", "09-doi-chieu"]:
    for f in files(folder):
        for uc in sorted(expand(read(f)) - uc_all):
            errors.append(f"{f.name} nhắc {uc} không tồn tại")

# ---------- 7. Trạng thái đơn: enum, state, đặc tả phải trùng ----------
cls01 = read(DOCS / "04-class" / "Class-01-MienDuLieu.md")
enum = re.search(r"class OrderStatus \{(.*?)\n  \}", cls01, re.S).group(1)
status_enum = set(re.findall(r"^\s*([A-Z_]+)\s*$", enum, re.M)) - {"enumeration"}
state_text = read(DOCS / "06-state" / "State-01-DonHang.md")
state_block = state_text.split("## B.")[0]
state_set = set(re.findall(r"^\s*(\w+) -->", state_block, re.M)) | set(
    re.findall(r"--> (\w+)\s*(?::|$)", state_block, re.M)
)
state_set -= {"_"}
if state_set != status_enum:
    errors.append(f"State-01 và enum OrderStatus lệch: {sorted(state_set ^ status_enum)}")
erd = read(DOCS / "03-erd" / "ERD-01-BrewLite.md")
for s in status_enum:
    if s not in erd:
        errors.append(f"ERD-01 thiếu trạng thái {s}")

# ---------- Kết quả ----------
print(f"Lớp: {len(classes)} · thông điệp đã kiểm: {n_msg} · route: {len(routes)} · UC: {len(uc_all)}")
if errors:
    print(f"\n{len(errors)} LỖI:")
    for e in errors:
        print(" -", e)
    sys.exit(1)
print("OK: các sơ đồ khớp nhau.")
