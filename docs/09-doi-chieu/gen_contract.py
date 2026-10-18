"""Dựng bản đề xuất API-CONTRACT từ bảng route (Class-02), DTO (Class-04) và ràng buộc validate.
Dùng: python3 -I gen_contract.py <thư mục docs> <file ra>"""
import re
import sys

docs, out = sys.argv[1], sys.argv[2]
svc = open(f"{docs}/04-class/Class-02-DichVu.md", encoding="utf8").read()
dto = open(f"{docs}/04-class/Class-04-DTO.md", encoding="utf8").read()

ROLE = {"-": "không cần JWT", "C": "Khách hàng", "S": "Nhân viên trở lên", "M": "chỉ Quản lý"}
routes = []
sec = svc.split("## Bảng route")[1].split("## Ghi chú thiết kế")[0]
for m in re.finditer(r"^\| (UC[^|]*) \| (.*?) \| (\w+\.\w+|[^|]*) \| ([^|]*) \| ([-CSM]) \|$", sec, re.M):
    uc, route, ctrl, _svc, role = [x.strip() for x in m.groups()]
    if route.startswith("không có"):
        continue
    rm = re.match(r"`(GET|POST|PUT|PATCH|DELETE) (\S+)`\s*(.*)", route)
    routes.append({"uc": uc, "method": rm.group(1), "path": rm.group(2), "note": rm.group(3), "ctrl": ctrl, "role": role})

# DTO nhận theo controller.method
dto_of = {}
for m in re.finditer(r"^\| (\S+) \| (\w+\.\w+) \| ([^|]*) \|$", dto.split("## DTO ↔ hàm nhận")[1], re.M):
    name, ctrl, _ = m.groups()
    dto_of.setdefault(ctrl, []).append(name)

# trường của từng DTO
fields = {}
for m in re.finditer(r"class (\w+) \{\n([\s\S]*?)\n  \}", dto):
    body = m.group(2)
    if "<<" in body:
        continue
    fields[m.group(1)] = [re.sub(r"^\s*\+", "", l).strip() for l in body.split("\n") if l.strip().startswith("+")]

val = re.search(r"## Ràng buộc validate[^\n]*\n\n([\s\S]*?)\n\n## ", dto).group(1)

lines = ["# API Contract — BrewLite (BẢN ĐỀ XUẤT, chưa thay `docs/API-CONTRACT.md`)", "",
         "> Dựng tự động từ `04-class/Class-02-DichVu.md` (bảng route), `Class-04-DTO.md` (DTO, ràng buộc) và `DacTa-UseCase.md` (mã lỗi, quy tắc).",
         "> Chỉ là đề xuất theo thiết kế mới (đăng nhập bằng số điện thoại, ví hoàn tiền, 24 bảng). Muốn dùng thì cả hai bên đồng ý rồi mới thay file `docs/API-CONTRACT.md`.",
         "> Kiểu dữ liệu bảng xem `schema.prisma.de-xuat` cùng thư mục. Khi sửa thiết kế, sửa file `.md` gốc rồi dựng lại bằng `09-doi-chieu/gen_contract.py`.", "",
         "Base URL: `http://localhost:3001` · Content-Type: `application/json` · Auth: `Authorization: Bearer <jwt>` (JWT sống 7 ngày, đăng xuất thì thu hồi).", "",
         "Mã lỗi chung: 400 sai dạng dữ liệu (class-validator) · 401 chưa đăng nhập hoặc JWT hết hạn, bị thu hồi · 403 sai vai trò · 404 không thấy · 409 xung đột trạng thái · 422 vi phạm nghiệp vụ. Danh sách phân trang 20 dòng mỗi trang (`?page=`).", "",
         "## Route", "", "| UC | Route | Vai trò | Body / query | Ghi chú |", "|---|---|---|---|---|"]
for r in routes:
    ds = ", ".join(f"`{d}`" for d in dto_of.get(r["ctrl"], [])) or "không có"
    lines.append(f'| {r["uc"]} | `{r["method"]} {r["path"]}` | {ROLE[r["role"]]} | {ds} | {r["note"]} |')
lines += ["", f"Tổng: {len(routes)} route.", "", "## DTO", "", "Mỗi dòng là `kiểu tên`. Ràng buộc từng trường xem bảng ở cuối.", ""]
for name, fl in fields.items():
    lines += [f"### {name}", "```", *fl, "```", ""]
lines += ["## Ràng buộc validate", "", val, ""]
open(out, "w", encoding="utf8").write("\n".join(lines))
print(f"{len(routes)} route, {len(fields)} DTO")
