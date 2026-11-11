# Hướng dẫn phân tích & thiết kế DB

Áp dụng cho mục 7 (Data model) của FS. Có hai chế độ, chọn theo input:

| Chế độ | Khi nào | Nguyên tắc |
|---|---|---|
| **A — Theo DB có sẵn** | Người dùng đưa thiết kế DB, hoặc dự án đã có entity/bảng liên quan | DB của người dùng là nguồn đúng. Dùng nguyên tên bảng, cột, kiểu. Mọi thay đổi chỉ là **đề xuất**, chờ duyệt |
| **B — Tự thiết kế** | Chưa có DB cho phần này | Thiết kế theo quy tắc mục 3, sinh DDL đầy đủ |

Có thể **trộn** hai chế độ: bảng đã có thì theo chế độ A, bảng mới cho tính năng thì theo chế độ B. Ghi rõ chế độ của từng bảng.

## 1. Nguồn DB có sẵn agent đọc được

| Dạng | Cách đọc |
|---|---|
| DDL `.sql` (CREATE TABLE/ALTER/INDEX) | Đọc trực tiếp |
| DBML / dbdiagram, PlantUML, mermaid `erDiagram` | Đọc trực tiếp |
| Data dictionary Excel/Word (bảng – cột – kiểu – mô tả) | Đọc bằng công cụ office sẵn có |
| Ảnh ERD | Đọc ảnh. Chỗ nào không đọc rõ → `Q-xx`, không đoán |
| Entity JPA trong code (`bom-*/entity`) | Glob/Grep. Coi như DB có sẵn |
| DB đang chạy | Chỉ khi người dùng yêu cầu và đồng ý. Chỉ chạy truy vấn đọc `information_schema` / `pg_catalog`. Không in thông tin kết nối hay mật khẩu ra tài liệu |

Không đọc được nguồn (file hỏng, định dạng lạ) → nói rõ, ghi `NEEDS_CONTEXT` cho phần DB. Không tự dựng lại DB "giống như" nguồn.

## 2. Chế độ A — phân tích DB có sẵn

1. **Chuẩn hoá thành data dictionary.** Mỗi bảng liên quan một bảng cột như template mục 7. Ghi nguồn cho từng bảng, ví dụ `(nguồn: db/schema.sql:120)`.
2. **Ánh xạ yêu cầu → cột.** Mỗi trường trên màn hình/API phải trỏ được tới một cột, hoặc ghi là trường tính toán.
3. **Đối chiếu**, ghi vào bảng *7.x Đối chiếu DB* với các loại phát hiện:

| Loại | Ví dụ | Xử lý |
|---|---|---|
| THIẾU | Yêu cầu cần "lý do huỷ" nhưng bảng không có cột | Đề xuất `ALTER TABLE ... ADD COLUMN`, gắn `[Đề xuất]` + `Q-xx` |
| THỪA | Cột không yêu cầu nào dùng | Ghi "chưa dùng trong FS này". Không đề xuất xoá |
| LỆCH KIỂU | Tiền tệ là `float`; ngày lưu `varchar` | Đề xuất kiểu đúng, nêu rủi ro (sai số, không so sánh được) |
| RÀNG BUỘC | Thiếu FK, unique, NOT NULL mà BR cần | Đề xuất constraint/index |
| LỆCH CORE | Không có 4 cột audit; khoá không phải `uuid`; enum là kiểu enum của Postgres | Xem mục 4 |

4. **Không tự sửa thiết kế của người dùng.** Bảng dữ liệu chính trong FS vẫn mô tả đúng DB hiện có. Thay đổi chỉ nằm ở phần *Đề xuất thay đổi DB* và trong file DDL dạng `ALTER`, đánh dấu `-- [Đề xuất] chờ duyệt`.

## 3. Chế độ B — quy tắc tự thiết kế (PostgreSQL)

**Đặt tên**
- Bảng: `snake_case`, số ít, có tiền tố module: `ct_contract`, `ct_contract_attachment`.
- Cột: `snake_case`. Khoá ngoại `{bảng_đích_không_tiền_tố}_id`, ví dụ `contract_id`.
- Constraint: `pk_{bảng}`, `fk_{bảng}_{cột}`, `uk_{bảng}_{cột}`, `ck_{bảng}_{cột}`, `idx_{bảng}_{cột...}`.

**Kiểu dữ liệu**

| Dữ liệu | Kiểu |
|---|---|
| Khoá chính | `uuid` (ứng dụng sinh — `GenerationType.UUID`) |
| Mã nghiệp vụ, mã danh mục | `varchar(n)` vừa đủ, unique khi cần |
| Văn bản ngắn / dài | `varchar(n)` / `text` (chỉ khi thật sự không giới hạn) |
| Tiền | `numeric(18,2)` + cột `currency` nếu đa tiền tệ. Không dùng `float`/`double` |
| Số lượng | `integer` / `bigint`; tỷ lệ `numeric(5,2)` |
| Ngày / thời điểm | `date` / `timestamp` |
| Cờ | `boolean NOT NULL DEFAULT false` |
| Trạng thái, loại | `varchar(20..30)` + `CHECK (... IN (...))`. Không dùng kiểu enum của Postgres (khó thêm giá trị, lệch với core) |
| Dữ liệu bán cấu trúc | `jsonb`, chỉ khi không cần lọc/ràng buộc theo từng trường |
| File | Không lưu file trong DB. Lưu `object_key` MinIO + metadata |

**Chuẩn hoá & quan hệ**
- Tối thiểu 3NF. Phi chuẩn hoá (lưu thêm tên, tổng) chỉ khi có lý do hiệu năng/lịch sử và phải ghi rõ lý do.
- n-n → bảng nối riêng với unique trên cặp khoá.
- Dữ liệu cần "chụp lại tại thời điểm" (tên đối tác lúc ký, đơn giá lúc đặt) → lưu bản sao, ghi rõ là snapshot.
- Danh mục cố định, ít giá trị → `CHECK`. Danh mục quản trị được → bảng danh mục riêng.
- Lịch sử/nhật ký → bảng `{bảng}_history` chỉ thêm, không sửa.

**Index**
- Mọi FK có index.
- Index theo bộ lọc chính của màn hình danh sách và điều kiện phân quyền dữ liệu, ví dụ `(unit_id, status)`.
- Unique theo BR (ví dụ mã hợp đồng). Với bảng xoá mềm: unique phải bỏ qua bản ghi đã xoá, dùng `CREATE UNIQUE INDEX ... WHERE is_deleted = false`.

## 4. Khớp với core (`core-persistence`)

| Base class | Cột bắt buộc trong bảng |
|---|---|
| `EntityBase` | `created_date timestamp NOT NULL`, `created_by varchar(50) NOT NULL`, `updated_date timestamp NOT NULL`, `updated_by varchar(50) NOT NULL` |
| `EntitySoftDeleteBase` | 4 cột trên + `is_deleted boolean NOT NULL DEFAULT false`, `deleted_date timestamp`, `deleted_by varchar(50)` |

- Trong bảng dữ liệu của FS **không liệt kê** các cột này. Trong DDL **phải có** đủ.
- Cột lưu username (`approved_by`...) dùng `varchar(50)` cho khớp `created_by`.
- DB có sẵn không có cột audit → hai lựa chọn, đưa vào `Q-xx`: (1) đề xuất `ALTER` thêm cột để kế thừa `EntityBase`; (2) entity không kế thừa base, mất audit tự động.
- Khoá có sẵn không phải `uuid` (ví dụ `bigint identity`) → giữ nguyên, ghi chú cho dev đổi kiểu `id` và chiến lược sinh khoá của entity.
- Core hiện **chưa có Flyway/Liquibase**. File DDL là script tay; dev đưa vào công cụ migration của dự án nếu có.

## 5. Đầu ra

1. **Mục 7 của FS:**
   - 7.0 Nguồn & chế độ.
   - Các `ENT-xx`.
   - ERD bằng mermaid `erDiagram`.
   - 7.x Đối chiếu DB (chế độ A) / Quyết định thiết kế (chế độ B).
   - Đề xuất thay đổi DB (nếu có).
2. **File DDL** cạnh FS: `specs/FS-NNN-slug.sql` (PostgreSQL), gồm:
   - Header ghi FS, version, chế độ.
   - `CREATE TABLE` đủ cột audit, PK/FK/UK/CHECK có tên, `CREATE INDEX`, `COMMENT ON TABLE/COLUMN` bằng tiếng Việt.
   - Chế độ A: chỉ `ALTER`/`CREATE` cho phần đề xuất, mỗi lệnh có `-- [Đề xuất] Q-xx`.
   - Viết để chạy được nhiều lần không lỗi (`IF NOT EXISTS`), không có `DROP`.

## 6. Tự kiểm tra phần DB

- [ ] Mỗi trường trên màn hình/API trỏ được tới cột hoặc ghi là trường tính toán.
- [ ] Mỗi BR về duy nhất/bắt buộc/khoảng giá trị có constraint hoặc ghi rõ kiểm tra ở service.
- [ ] Mọi FK có index; bộ lọc chính của danh sách có index.
- [ ] Bảng kế thừa base class có đủ cột audit trong DDL.
- [ ] Chế độ A: không có thay đổi nào ngoài phần *Đề xuất*; mỗi đề xuất có `Q-xx`.
- [ ] ERD khớp bảng dữ liệu và DDL (tên bảng, quan hệ).
