# BrewLite ☕

Ứng dụng đặt cà phê không dùng tiền mặt — đồ án môn Công nghệ Phần mềm.

## Yêu cầu môi trường

- Node.js 20+
- npm 10+
- Docker & Docker Compose (để chạy PostgreSQL hoặc toàn bộ stack)

## Cài đặt và chạy từng phần

### Frontend (Next.js — port 3000)

```bash
cd frontend
npm install
npm run dev
```

Mở http://localhost:3000

### Backend (NestJS — port 3001)

```bash
cd backend
npm install
npm run start:dev
```

Kiểm tra: `curl http://localhost:3001/health` → `{"status":"ok"}`

## Chạy bằng Docker Compose (toàn bộ stack)

```bash
# Sao chép biến môi trường
cp .env.example .env
# Chỉnh sửa .env nếu cần, rồi:
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- PostgreSQL: localhost:5432

## Biến môi trường

```bash
cp .env.example .env
# Mở .env và điền giá trị thật trước khi chạy docker compose
```

Xem `.env.example` để biết danh sách đầy đủ. Các biến quan trọng:

| Biến | Mô tả |
|---|---|
| `POSTGRES_USER` | Tên user đăng nhập PostgreSQL |
| `POSTGRES_PASSWORD` | Mật khẩu PostgreSQL — đặt chuỗi mạnh khi deploy |
| `POSTGRES_DB` | Tên database được tạo khi container khởi động lần đầu |
| `DATABASE_URL` | Connection string đầy đủ — phải khớp 3 biến trên |
| `JWT_SECRET` | Secret key ký JWT (đổi trước khi deploy) |
| `NEXT_PUBLIC_API_URL` | URL backend mà frontend gọi |

## Tài liệu

| File | Nội dung |
|---|---|
| `CLAUDE.md` | Hướng dẫn cho AI, quy ước nhóm |
| `docs/API-CONTRACT.md` | Hợp đồng API giữa frontend và backend |
| `docs/BACKLOG.md` | Danh sách task và trạng thái Sprint |
| `docs/RETROSPECTIVE.md` | Ghi chú cuối Sprint |

## Cấu trúc thư mục

```
brewlite/
├── frontend/          # Next.js app
├── backend/           # NestJS API
├── docs/              # Tài liệu dự án
├── docker-compose.yml
├── .env.example
└── CLAUDE.md
```
