# Shop Bán Hàng

Sàn thương mại điện tử nhiều người bán, xây trên bộ core (Spring Boot + Keycloak + React). Gồm:

- **Web người dùng (storefront)**: người mua, người bán (Seller Center), shipper, chatbot AI gợi ý sản phẩm, thử sản phẩm bằng camera (AR).
- **Web quản trị**: quản lý tài khoản, shop, shipper, sản phẩm, đơn hàng, voucher, danh mục, thống kê thu nhập.

Hợp đồng nghiệp vụ và API: [`docs/shop-contract.md`](docs/shop-contract.md).

## Cấu trúc thư mục

```text
.
├── be/                     # Backend: Java 21, Spring Boot 4.1.1, Maven multi-module
│   ├── core-*/             # Hạ tầng dùng chung từ core
│   ├── bom-sa/ res-sa/     # Quản trị hệ thống (user, role, menu/quyền)
│   ├── bom-shop/ res-shop/ # Nghiệp vụ sàn: sản phẩm, giỏ hàng, đơn hàng, seller, shipper, chatbot, thống kê
│   └── mvnw, mvnw.cmd      # Maven Wrapper (không cần cài Maven)
├── fe/                     # Frontend: pnpm + Turborepo
│   ├── apps/web/           # Web quản trị (cổng 8088)
│   ├── apps/storefront/    # Web người dùng (cổng 3000)
│   └── packages/           # UI và thư viện dùng chung
├── db/                     # SQL: schema core, schema shop, dữ liệu khởi tạo (menu, quyền, danh mục)
├── infra/                  # Docker Compose: PostgreSQL, Redis, Consul, Keycloak, MinIO + script
└── docs/                   # Tài liệu nghiệp vụ / API
```

## Yêu cầu

| Công cụ | Phiên bản | Ghi chú |
| ------- | --------- | ------- |
| Docker Desktop (Compose v2) | mới | Chạy PostgreSQL, Redis, Consul, Keycloak, MinIO |
| JDK | 21 | Backend. Maven tự tải qua `be/mvnw` |
| Node.js | >= 20 | Frontend |
| pnpm | 10.4.1 | `corepack enable` sẽ dùng đúng phiên bản |
| Anthropic API key | tùy chọn | Cho chatbot AI. Không có key thì chatbot dùng gợi ý theo luật |

## Cổng dịch vụ

| Dịch vụ | Địa chỉ |
| ------- | ------- |
| Web người dùng | http://localhost:3000 |
| Web quản trị | http://localhost:8088 |
| Backend API / Swagger | http://localhost:8200 · http://localhost:8200/swagger-ui.html |
| Keycloak | http://localhost:8080 |
| Consul UI | http://localhost:8500 |
| MinIO console | http://localhost:9001 |

## Chạy project lần đầu

Các lệnh chạy từ thư mục gốc project. Windows dùng PowerShell; macOS/Linux dùng terminal thường.

### Bước 1: Tạo file cấu hình hạ tầng

```powershell
Copy-Item infra\.env.example infra\.env      # Windows
```

```bash
cp infra/.env.example infra/.env             # macOS/Linux
```

Mở `infra/.env` và điền **tất cả** các khóa:

- `POSTGRES_*`, `KEYCLOAK_ADMIN_*`, `MINIO_ROOT_*`: tài khoản các dịch vụ do bạn tự đặt.
- `KEYCLOAK_CLIENT_SECRET`: chuỗi ngẫu nhiên bất kỳ. Keycloak và backend cùng đọc giá trị này.
- `APP_CRYPTO_KEY`: đúng 16, 24 hoặc 32 ký tự.
- `ANTHROPIC_API_KEY`: để trống nếu không dùng chatbot AI.
- `SHOP_ADMIN_*`: tài khoản quản trị đầu tiên. `SHOP_ADMIN_ROLE_CODE` phải trùng mã role admin trong `db/03-seed.sql`.

Không dùng ký tự `"`, `\` hoặc xuống dòng trong giá trị. Không commit file `.env`.

### Bước 2: Khởi động hạ tầng

```bash
cd infra
docker compose up -d
docker compose ps        # đợi postgres, redis, consul, keycloak ở trạng thái "healthy"
cd ..
```

Lần đầu khởi động, PostgreSQL tự chạy `db/01-core-schema.sql`, `db/02-shop-schema.sql`, `db/03-seed.sql`.

### Bước 3: Nạp cấu hình backend vào Consul

```powershell
powershell -ExecutionPolicy Bypass -File infra\scripts\load-consul-config.ps1
```

```bash
sh infra/scripts/load-consul-config.sh
```

Consul ở chế độ dev không lưu dữ liệu, nên phải chạy lại bước này mỗi khi container Consul khởi động lại.

### Bước 4: Tạo tài khoản quản trị

```powershell
powershell -ExecutionPolicy Bypass -File infra\scripts\bootstrap-admin.ps1
```

```bash
sh infra/scripts/bootstrap-admin.sh
```

### Bước 5: Chạy backend (terminal 1)

```powershell
cd be
.\mvnw.cmd clean install -DskipTests "-Dmaven.gitcommitid.skip=true"
java "-Duser.timezone=Asia/Ho_Chi_Minh" -jar core-server\target\core-server-0.0.1-SNAPSHOT.jar --spring.profiles.active=local
```

```bash
cd be
./mvnw clean install -DskipTests -Dmaven.gitcommitid.skip=true
java -Duser.timezone=Asia/Ho_Chi_Minh -jar core-server/target/core-server-0.0.1-SNAPSHOT.jar --spring.profiles.active=local
```

- `-Duser.timezone=Asia/Ho_Chi_Minh` là bắt buộc trên Windows. Java mặc định dùng `Asia/Saigon`, tên mà PostgreSQL 17 không nhận, nên sẽ từ chối kết nối.
- `-Dmaven.gitcommitid.skip=true` chỉ cần khi repo chưa có commit nào.
- Nếu cổng 8200 bận, thêm `--server.port=8210` và đặt `FIS_API_BASE_URL` của cả hai app FE theo cổng đó.
- Có thể dùng Podman thay Docker: `podman compose up -d`. Các script trong `infra/scripts` tự dùng `podman` khi không có `docker`.

Kiểm tra: http://localhost:8200/actuator/health trả về `UP`.

### Bước 6: Cài và cấu hình frontend

```bash
cd fe
corepack enable
pnpm install
```

Tạo `fe/apps/web/.env` (web quản trị) từ `fe/apps/web/.env.example`:

```dotenv
FIS_SERVER_PORT=8088
FIS_API_BASE_URL=http://localhost:8200
FIS_APP_CODE=CORE
FIS_PUBLIC_URL=/
FIS_ENV_LABEL=LOCAL
FIS_SSO_URL=http://localhost:8080
FIS_REALM=shop
FIS_CLIENT_ID=shop-app
FIS_REDIRECT_URL=http://localhost:8088/api/sso/callback
```

Tạo `fe/apps/storefront/.env` (web người dùng) từ `fe/apps/storefront/.env.example`:

```dotenv
FIS_SERVER_PORT=3000
FIS_API_BASE_URL=http://localhost:8200
FIS_SSO_URL=http://localhost:8080
FIS_REALM=shop
FIS_CLIENT_ID=shop-app
FIS_REDIRECT_URL=http://localhost:3000/auth/callback
```

### Bước 7: Chạy frontend (terminal 2)

```bash
cd fe
pnpm dev                              # chạy cả web quản trị và web người dùng
# hoặc chạy riêng từng app:
pnpm --filter web dev                 # quản trị: http://localhost:8088
pnpm --filter storefront dev          # người dùng: http://localhost:3000
```

## Sử dụng

| Vai trò | Cách có tài khoản | Truy cập |
| ------- | ----------------- | -------- |
| Quản trị | Tạo ở Bước 4 | http://localhost:8088 → module "Quản trị sàn" |
| Người mua | Tự đăng ký trên web người dùng | http://localhost:3000 |
| Người bán | Người mua gửi đăng ký mở shop, quản trị duyệt ở màn **Shop** | http://localhost:3000/seller |
| Shipper | Người mua gửi đăng ký shipper, quản trị duyệt ở màn **Shipper** | http://localhost:3000/shipper |

Một tài khoản có thể vừa là người mua, vừa là người bán, vừa là shipper.

Luồng đơn hàng (thanh toán COD):

```text
Chờ xác nhận → (seller) Đã xác nhận → (seller) Chờ lấy hàng → (shipper nhận) Đang lấy
→ (shipper) Đang giao → (shipper) Đã giao → (người mua xác nhận / tự động sau 7 ngày) Hoàn thành
```

### Chatbot AI

- Nút chat nổi xuất hiện ở mọi trang của web người dùng. Chatbot gợi ý sản phẩm theo xu hướng, khoảng giá, bán chạy, giảm giá, lấy dữ liệu thật từ cơ sở dữ liệu.
- Có `ANTHROPIC_API_KEY` thì dùng Claude (model đặt ở `shop.ai.model` trong Consul). Không có key hoặc khi API lỗi thì tự chuyển sang gợi ý theo luật.

### Thử sản phẩm bằng camera (AR)

1. Seller vào **Sản phẩm → Thêm/Sửa**, chọn loại AR và tải ảnh PNG **nền trong suốt** của sản phẩm. Các loại AR: kính, mũ, trang sức, áo, quần, đồ vật/nội thất.
2. Người mua mở trang chi tiết sản phẩm, bấm **"Thử trực tiếp bằng camera"** rồi cho phép truy cập camera.
3. Kính, mũ, trang sức bám theo khuôn mặt. Áo, quần bám theo dáng người. Đồ vật thì người mua tự kéo, co giãn, xoay. Có nút chụp ảnh để tải về.

Camera chỉ hoạt động trên `localhost` hoặc HTTPS. Xử lý hoàn toàn trên trình duyệt, không gửi hình ảnh lên server.

## Kiểm tra build

```bash
cd be && ./mvnw -q -DskipTests compile             # backend
cd fe/apps/web && npx tsc --noEmit && pnpm build    # web quản trị
cd fe/apps/storefront && npx tsc --noEmit && pnpm build   # web người dùng
```

## Xử lý sự cố

| Hiện tượng | Cách xử lý |
| ---------- | ---------- |
| Backend báo không tìm thấy cấu hình | Consul đã khởi động lại → chạy lại Bước 3 |
| Backend lỗi `issuer` khi khởi động | Keycloak chưa sẵn sàng hoặc chưa import realm → `docker compose logs keycloak` |
| `bootstrap-admin` báo thiếu role | `db/03-seed.sql` chưa chạy hoặc `SHOP_ADMIN_ROLE_CODE` sai |
| Đăng nhập xong không quay lại trang | `FIS_REDIRECT_URL` không khớp redirect URI của client `shop-app` trong Keycloak |
| Muốn xóa sạch dữ liệu và chạy lại | `cd infra && docker compose down -v && docker compose up -d`, rồi làm lại Bước 3 và 4 |

Chi tiết hạ tầng: [`infra/README.md`](infra/README.md). Quy ước code: [`be/CONVENTIONS.md`](be/CONVENTIONS.md), [`fe/CONVENTIONS.md`](fe/CONVENTIONS.md).

## Bảo mật cấu hình

Không commit giá trị thật. Secret backend nằm trong Consul, được nạp từ `infra/.env`. Frontend dùng `apps/*/.env`. Các file `.env` đã nằm trong `.gitignore`; chỉ commit `.env.example`.
