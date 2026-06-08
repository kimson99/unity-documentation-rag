# Yêu cầu
- Nodjes: >=22
- Python: >=3.12
- Docker: >=29
- pnpm: >=10

# Khởi tạo
## Infras
1. `docker compose ./docker/db-compose.yml`
2. Connect vào PostgreSQL bằng DBMS. Credential default nằm trong `db-compose.yml` và port là `15432`.
3. Chạy SQL `CREATE EXTENSION IF NOT EXISTS vector;` để kích hoạt extension

## Cài đặt packages & thiết lập
1. Tại root project, chạy `pnpm install`
2. Vào evaluator bằng `cd packages/evaluator`
3. Tạo môi trường ảo cho python `python -m venv .venv`
4. Kích hoạt `source .venv/bin/active`
5. Cài packages `pip install -r requirements.txt`
6. Tại các module con, như module backend `cd packages/backend`.
7. Tạo file chứa biến môi trường `cp .env.example .env` Điền các thông tin cần thiết như API Key

## Backend

- Start: `pnpm backend dev`
- Tạo acccount lần đầu: `pnpm backend create-account <flags>`
- Format & lint: `pnpm backend format && pnpm backend lint`
- Tự động tạo bộ câu hỏi: `pnpm backend gen-questions --dir <thư mục chứa files tài liệu>`
- Seed dữ liệu và index nhanh: `pnpm backend seed --dir <thư mục chứa files tài liệu> --limit <số lượng file>`

## Frontend
- Start: `pnpm frontend dev`

## Evalutator
- Chạy thử nghiệm: `python evaluate.py --experiment <tên định danh> --per-topic <số lượng chủ đề>`

