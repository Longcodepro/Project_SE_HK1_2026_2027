# BrewLite — Hướng dẫn cho AI

## Dự án

BrewLite là ứng dụng đặt cà phê không dùng tiền mặt dành cho sinh viên. Frontend Next.js giao tiếp với Backend NestJS qua REST API, dữ liệu lưu PostgreSQL. Nhóm 2 người, **deadline ~24 giờ từ 2026-10-05** — ưu tiên chạy được trước, sạch code sau.

## Phân công

| Thành viên | Vai trò | Thư mục phụ trách |
|---|---|---|
| Long | Backend + Scrum Master | `backend/` |
| Tài | Development Team + Frontend | `frontend/` |

> **AI đang hỗ trợ ai thì chỉ sửa file trong thư mục của người đó**, trừ khi được yêu cầu rõ ràng.
>
> - AI hỗ trợ Long → chỉ sửa `backend/`, docs nếu cần, root config
> - AI hỗ trợ Tài → chỉ sửa `frontend/`, docs nếu cần, root config

## Quy trình — Agile Scrum 3 Sprint

| Sprint | Thời điểm | Mục tiêu | Task |
|---|---|---|---|
| Sprint 1 | Tối nay | Menu xem được | 1, 2, 3 |
| Sprint 2 | Sáng mai | Chọn món, giỏ hàng, đặt đơn | 4, 5, 6, 7 |
| Sprint 3 | Chiều mai | Thanh toán và bàn giao | 8, 9, 10 |

## Trước khi làm bất kỳ task nào

1. Đọc `docs/BACKLOG.md` → biết task nào đang ở trạng thái nào
2. Đọc `docs/API-CONTRACT.md` → biết hình dạng request/response chính xác
3. **KHÔNG tự ý đổi API contract** — muốn đổi phải báo người kia trước, rồi mới commit

## Quy ước commit — TIẾNG VIỆT CÓ DẤU (bắt buộc)

```
<loại>(task-N): <mô tả tiếng Việt, động từ đứng đầu>
```

**Các loại hợp lệ:** `feat` `fix` `chore` `docs` `refactor` `test` `style`

**Quy tắc:**
- Mô tả viết thường, không chấm cuối câu, dưới 72 ký tự
- Mỗi task hoàn thành **commit một lần** — không gom nhiều task vào một commit
- Sửa lỗi task đã xong: dùng `fix(task-N)` đúng số task đó
- Nếu một task cần nhiều commit vẫn giữ nguyên số task

**Ví dụ đúng:**
```
chore(task-1): khởi tạo monorepo, cấu hình và tài liệu nhóm
feat(task-2): thêm endpoint lấy danh sách sản phẩm
feat(task-3): dựng trang menu có trạng thái tải và rỗng
feat(task-4): thêm màn chi tiết, chọn size và topping
feat(task-5): thêm giỏ hàng, tính tổng tiền và badge số lượng
feat(task-6): thêm api tạo đơn hàng, lưu trạng thái chờ xử lý
feat(task-7): thêm đăng ký đăng nhập bằng jwt
feat(task-8): tích hợp thanh toán giả lập ví và thẻ
feat(task-9): thêm màn xác nhận đơn và lịch sử đơn hàng
feat(task-10): thêm máy trạng thái đơn hàng và chặn chuyển sai
fix(task-5): sửa lỗi tổng tiền không cập nhật khi xóa món
docs(task-9): bổ sung hướng dẫn chạy bằng docker compose
```

**Tuyệt đối không thêm đồng tác giả AI vào commit:**
- Không dùng `Co-Authored-By: Claude` hay bất kỳ AI nào trong commit message
- Commit là của người trong nhóm, không phải của công cụ

**Ví dụ sai (không được dùng):**
```
update code
fix bug
feat: add product API              ← mô tả tiếng Anh
feat(task-2,task-3): làm xong ...  ← gộp 2 task
```

## Quy ước code

- TypeScript `"strict": true` trên cả hai project
- Tên biến, hàm, file: **tiếng Anh**
- Comment logic phức tạp: **tiếng Việt**
- Frontend: component → PascalCase, hook → camelCase bắt đầu `use`
- Backend: theo chuẩn NestJS (module/controller/service/dto)

## File trọng điểm dùng chung — KHÔNG tự ý sửa

Các file dưới đây ảnh hưởng tới cả hai người. Muốn sửa phải **DỪNG LẠI**, nêu lý do kèm diff đề xuất, chờ đồng ý rồi mới commit. Không "tiện tay" sửa khi đang làm task khác.

| File | Lý do dùng chung |
|---|---|
| `backend/prisma/schema.prisma` | Định nghĩa bảng, đổi là đổi cả database |
| `backend/prisma/migrations/` | Migration đã commit thì **không sửa**, chỉ tạo migration mới |
| `backend/src/app.module.ts` | Root module, nơi đăng ký mọi sub-module |
| `backend/src/main.ts` | Bootstrap, CORS, ValidationPipe toàn cục |
| `docs/API-CONTRACT.md` | Hợp đồng request/response giữa FE và BE |
| `docker-compose.yml` | Orchestration cả ba service |
| `backend/Dockerfile`, `frontend/Dockerfile` | Cách build image |
| `.env.example` | Danh sách biến môi trường chuẩn của nhóm |
| `package-lock.json` (cả hai bên) | Khóa phiên bản dependency, sửa tay là vỡ `npm ci` |
| `CLAUDE.md` | Chính file này |

## Chạy dự án bằng Docker

Xem mục **"Chạy nhanh"** trong [README.md](README.md). Một lệnh `docker compose up --build` là có đủ Postgres, backend và frontend.

## Definition of Done (phải đủ 6 ý mới được tick Done)

1. Code chạy được, không lỗi build
2. Đúng tiêu chí chấp nhận của task trong BACKLOG.md
3. Có commit Git mô tả rõ ràng, được người kia review
4. API có validate đầu vào bằng class-validator
5. UI xử lý trạng thái loading và lỗi
6. README có hướng dẫn chạy phần mình làm

## Stack công nghệ

| Tầng | Công nghệ |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, TailwindCSS, Zustand |
| Backend | NestJS, TypeScript, REST, class-validator, JWT/Passport |
| Database | PostgreSQL + Prisma |
| DevOps | Docker Compose |

## Quy ước nhánh

- Mỗi task làm trên nhánh riêng: `<tên-người>/task-N-mo-ta-ngan`
- Ví dụ: `long/task-3-trang-menu`, `tai/task-2-api-san-pham`
- Không push thẳng vào main. Xong task thì mở Pull Request để người kia review.
- Không tự đặt tên nhánh khác với quy ước này.
