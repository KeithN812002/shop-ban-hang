# Quy ước core mà Feature Spec phải bám

Tóm tắt những gì FPT core đã có sẵn và cách đặc tả phải mô tả để dev triển khai không phải đổi. Nguồn chi tiết: `be/CONVENTIONS.md`, `fe/CONVENTIONS.md`. Khi hai nơi khác nhau, **CONVENTIONS.md thắng** — cập nhật file này.

## 1. Core đã có sẵn — không đặc tả lại, chỉ tham chiếu

| Năng lực | Có sẵn trong core | Spec chỉ cần ghi |
|---|---|---|
| Đăng nhập SSO Keycloak, refresh token, OTP đổi mật khẩu | `bom-sa` `/sa/auth/*` | "Dùng xác thực của core" |
| Người dùng nội bộ / bên ngoài | `/sa/internal-user/*`, `/sa/external-user/*` | Vai trò nào được dùng chức năng mới |
| Vai trò, phân quyền, menu | `/sa/role/*`, `/sa/permission/*` (bảng `sa_permission`) | Seed menu/permission (mục 5) |
| Audit cột created/updated by/date | `EntityBase` | Không liệt kê cột audit |
| Xoá mềm | `EntitySoftDeleteBase` (`is_deleted`) | Nói rõ entity nào xoá mềm |
| Gửi email (outbox + template) | `core-email`, `/sa/email-template/{type}` | Event code (string), biến template, người nhận |
| Cache Redis | `core-cache` | Chỉ khi có yêu cầu hiệu năng cụ thể |
| Lưu file MinIO | `core-storage` | Loại file, dung lượng tối đa, số lượng |
| Thông báo lỗi đa ngôn ngữ | `BaseException` + `messages*.properties` | Mã lỗi + câu vi/en |

## 2. API (BE: `res-{domain}` mỏng, logic ở `bom-{domain}`)

- Base path: `/{domain}/{resource}` — **không** có tiền tố `/api`.
- Đọc: `GET /search` (phân trang, `{X}FilterRequest` qua query), `GET /{id}`, `GET /options` (dropdown).
- Ghi: `POST /create`, `POST /update`, `POST /delete` — **không** dùng PUT/DELETE.
- Hàng loạt: `POST /{action}-bulk` (ví dụ `/active-bulk`, `/delete-bulk`) nhận danh sách id.
- Hành động nghiệp vụ: `POST /{verb}` (ví dụ `/approve`, `/cancel`).
- Response luôn là `Response<T>`; danh sách phân trang trả `PageResult<T>`.
- DTO: `{X}CreateRequest`, `{X}UpdateRequest`, `{X}FilterRequest`, `{X}Response`, `{X}DetailResponse`.
- Mặc định **mọi endpoint đều kiểm tra quyền**. Endpoint công khai (lookup/options) phải ghi rõ → dev gắn `@SkipPermissionCheck`.
- Người dùng / đơn vị hiện tại lấy từ token, **không** nhận qua body.

## 3. Lỗi & i18n

- Mã lỗi là i18n key `{domain}.{field}.{rule}` (ví dụ `contract.code.duplicate`) hoặc mã nghiệp vụ `APP_*` (`APP_DATA404` = không tìm thấy).
- Mỗi mã lỗi trong spec phải có **câu tiếng Việt và tiếng Anh**.
- FE: mọi chữ hiển thị đi qua i18n, namespace theo domain (`i18n/locales/{domain}/{vi,en}.json`).

## 4. Data model

- Entity đặt trong `bom-{domain}/entity/`, tên bảng `snake_case`, nên có tiền tố domain (`ct_contract`).
- Khoá chính `id` UUID.
- Mặc định kế thừa `EntityBase` (`created_date`, `created_by`, `updated_date`, `updated_by` — đều NOT NULL). Chỉ dùng `EntitySoftDeleteBase` khi nghiệp vụ yêu cầu giữ bản ghi đã xoá (thêm `is_deleted`, `deleted_date`, `deleted_by`).
- Quy tắc phân tích DB có sẵn / tự thiết kế và sinh DDL: xem `db-design-guide.md`.
- Enum chung (`StatusBasic`: ACTIVE/INACTIVE) có sẵn; enum nghiệp vụ đặt trong module domain.
- Giá trị mở rộng được (loại sự kiện, loại mẫu) → string code, không phải enum.
- Tìm kiếm động dùng `SpecificationBuilder` → spec chỉ cần nêu trường lọc + kiểu so khớp (bằng, chứa, khoảng, trong danh sách).

## 5. Chuyển trạng thái

Mỗi hành động đổi trạng thái phải có: trạng thái nguồn hợp lệ (guard), trạng thái đích, actor/quyền, mã lỗi khi sai trạng thái, có ghi lịch sử không (`{X}HistoryService.logStateChange` với action + source).

## 6. Menu & quyền (`sa_permission`)

Màn hình **chỉ hiện khi có bản ghi menu + quyền ở BE**. Spec luôn liệt kê seed:

| Cột | Ý nghĩa |
|---|---|
| `code` | Mã duy nhất, ≤ 20 ký tự |
| `name` / `foreign_name` | Tên vi / en |
| `parent_code` | Mã cha |
| `type` | `ROOT` (module/ứng dụng) → `GROUP` (nhóm menu) → `MENU` (mục menu sidebar, mở 1 màn hình) → `PAGE` (màn hình con không hiện trên sidebar, ví dụ trang chi tiết; cha là MENU/PAGE) → `FUNCTION` (nút/hành động) → `API` |
| `module_code` | Mã module (≤ 20) |
| `url` | URL trên trình duyệt (ví dụ `/ct/contract`) |
| `path_folder` | Thư mục màn hình dưới `apps/web/src/pages/` (ví dụ `Contract/ContractList` → `pages/Contract/ContractList/index.tsx`). Bắt buộc với `MENU`/`PAGE` |
| `uri` + `method` | Với `API`: đường dẫn BE + GET/POST. So khớp bằng `AntPathMatcher` với request URI, nên dùng được `{id}`, `*`, `**`. Lưu ý `/x/{id}` cũng khớp `/x/search` |
| `button_action` | Với `FUNCTION`: mã action FE (`create`, `update`, `delete`, `approve`...) |
| `icon`, `sort_order` | Hiển thị menu |

Quy ước quyền FE: `/parentUrl/{action}`; nút dùng `ActionButton` với `actionCode` = `button_action`.

## 7. Màn hình FE (`apps/web`)

- Đường dẫn: `apps/web/src/pages/{Module}/{Screen}/index.tsx` (export default), logic trong `use{Screen}Page`.
- Không có route file — màn hình đến từ URL menu.
- `loadingType` skeleton: `table-list` · `table-list-actions` · `table-only` · `panel` · `permission` · `sidebar-table`.
- Empty state: `no-records` · `no-match` · `needs-input` · `blocked` · `error`.
- Nút: chọn `actionType` có sẵn (`addNew`, `save`, `create`, `update`, `delete`, `cancel`, `back`, `search`, `export`, `upload`, `send`, `approve`, `confirm`, `reject`, `return`, `verify`, `sync`...).
- Dashboard module / badge menu: đăng ký qua `src/config/registerModules.ts` (chỉ ghi khi cần).
- UI có sẵn trong `@workspace/ui`: DataTable, Form, Textfield, Select, DatePicker, Numberfield, Checkbox, RadioGroup, Switch, Uploader/FileUpload, TextArea, RichTextEditor, Tree, Transfer, Tabs, Stepper, Dialog, ConfirmDialog, Sheet, PageActionBar, AuditInfo...
