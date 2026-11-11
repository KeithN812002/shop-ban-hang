# ba-agent — Agent BA sinh đặc tả cho dev

Agent Claude Code đóng vai Business Analyst. Đầu vào là đặc tả thô của người dùng (mô tả, ghi chú họp, file Word/Excel/PDF, ảnh). Đầu ra là **Feature Spec (FS)** bám quy ước của FPT core (`be/`, `fe/`), để dev BE/FE triển khai trực tiếp.

## Cấu trúc

```
ba-agent/
├── .claude/agents/ba-spec-writer.md   # định nghĩa agent
├── templates/feature-spec.md          # mẫu FS
├── examples/FS-001-quan-ly-hop-dong.md  # FS hoàn chỉnh làm chuẩn tham chiếu
├── examples/FS-001-quan-ly-hop-dong.sql # DDL PostgreSQL đi kèm FS mẫu
└── references/
    ├── core-contract.md               # quy ước core mà FS phải bám (API, entity, menu/permission, màn hình)
    └── analysis-checklist.md          # checklist phân tích / câu hỏi làm rõ
```

## Yêu cầu

- Đã cài [Claude Code](https://docs.claude.com/en/docs/claude-code) và đăng nhập (`claude` chạy được trong terminal).
- Đã clone repo core về máy: `git clone https://github.com/KeithN812002/core.git`.

## Cài vào dự án

`<core>` là thư mục clone repo core (mặc định `~/FPT/core`).

Dự án mới dựng từ core: copy cả thư mục `ba-agent/` vào gốc dự án, rồi copy agent vào chỗ Claude Code đọc:

```powershell
Copy-Item -Recurse <core>\ba-agent <du-an>\ba-agent
New-Item -ItemType Directory -Force <du-an>\.claude\agents
Copy-Item <du-an>\ba-agent\.claude\agents\ba-spec-writer.md <du-an>\.claude\agents\
```

Dùng cho mọi dự án trên máy: copy `ba-spec-writer.md` vào `~/.claude/agents/`. Khi dự án không có `ba-agent/`, agent tự đọc template và reference từ `<core>/ba-agent`.

## Cách dùng

**Cách 1 — phiên tương tác (khuyến nghị).** Agent hỏi lại bạn các điểm mơ hồ trước khi viết:

```bash
cd <du-an>
claude --agent ba-spec-writer
> Viết đặc tả chức năng quản lý hợp đồng: ... (hoặc: đọc file yeu-cau/hop-dong.docx)
```

**Cách 2 — gọi như subagent** trong một phiên Claude Code bình thường:

```
> Dùng agent ba-spec-writer viết FS cho chức năng ... từ file yeu-cau.docx
```

Subagent không hỏi lại được. Nó ghi giả định (`[Giả định]`) và trả về danh sách câu hỏi mở `Q-xx`. Bạn trả lời rồi yêu cầu cập nhật FS.

## Phân tích DB

Agent chọn chế độ cho từng bảng (chi tiết: `references/db-design-guide.md`):

| Chế độ | Khi nào | Agent làm gì |
|---|---|---|
| **A — Theo DB có sẵn** | Bạn đưa DDL `.sql`, DBML, data dictionary Excel/Word, ảnh ERD; hoặc dự án đã có entity liên quan | Giữ nguyên tên bảng/cột/kiểu. Đối chiếu với yêu cầu: THIẾU / THỪA / LỆCH KIỂU / RÀNG BUỘC / LỆCH CORE. Thay đổi chỉ ở dạng **đề xuất** (`[Đề xuất]` + `Q-xx`), không tự sửa thiết kế của bạn |
| **B — Tự thiết kế** | Chưa có DB | Thiết kế 3NF theo quy tắc đặt tên, kiểu và index; khớp cột audit của `EntityBase`; ghi bảng *Quyết định thiết kế* kèm lý do |

Cả hai chế độ đều sinh ERD (mermaid) trong FS và file DDL PostgreSQL `specs/FS-NNN-<slug>.sql` chạy lại được nhiều lần. Đọc DB đang chạy chỉ khi bạn yêu cầu, và chỉ truy vấn đọc schema.

```
> Viết FS chức năng hợp đồng, DB đã có ở db/schema.sql      # chế độ A
> Viết FS chức năng hợp đồng, chưa có DB                    # chế độ B
```

## Đầu ra

- `specs/FS-NNN-<slug>.md`: một file cho tính năng vừa.
- `specs/FS-NNN-<slug>/`: tính năng lớn, tách thành `README.md`, `data-api.md`, `screens.md`, `acceptance.md`.

Một FS gồm: phạm vi, actor & phân quyền, luồng, bảng chuyển trạng thái, business rule (`BR`), data model (`ENT`), API (`API`) + mã lỗi vi/en, màn hình (`SCR`), **seed menu/permission `sa_permission`**, email, acceptance criteria (`AC`, Given/When/Then), NFR, giả định, câu hỏi mở, truy vết, gợi ý phân rã task BE/FE.

Vòng đời: `Draft` → `Ready` (đã chốt hết câu hỏi mở) → `Approved`. Dev chỉ nên bắt đầu khi FS ở trạng thái `Ready`.

## Bảo trì

Khi `be/CONVENTIONS.md` hoặc `fe/CONVENTIONS.md` đổi (endpoint, skeleton, actionType, cấu trúc permission), cập nhật `references/core-contract.md` theo. Agent coi CONVENTIONS.md là nguồn đúng khi hai nơi lệch nhau.
