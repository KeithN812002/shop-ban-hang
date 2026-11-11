# Shop — Domain & API Contract

Source of truth shared by backend (`be/bom-shop`, `be/res-shop`), storefront (`fe/apps/storefront`) and admin screens (`fe/apps/web/src/pages/ShopAdministration`). Change this file first when a contract changes.

## 1. Actors

| Actor | How identified | Where |
| ----- | -------------- | ----- |
| Guest | no token | storefront public pages, chatbot |
| Buyer | any authenticated Keycloak user (self-registered via `/shop/public/auth/register`) | storefront |
| Seller | buyer that owns a `shop_store` with status `ACTIVE` | storefront `/seller/*` (Seller Center) |
| Shipper | buyer that has a `shop_shipper` row with status `ACTIVE` | storefront `/shipper/*` |
| Admin | core internal user, menu/permission-driven | admin web (`fe/apps/web`) |

One account can be buyer + seller + shipper at the same time. Seller/shipper registration is a request (`PENDING`) approved by an admin.

## 2. Conventions (inherited from core)

- IDs are `UUID`. Every response is `Response<T>` = `{ statusCode, message, data, error?, traceId? }`.
- Paged result = `PageResult<T>` = `{ items, totalElements, totalPages, pageNumber, pageSize }`. Paged filters extend `PagingBase` (`pageNumber` 1-based, `pageSize`, `fieldName`, `sortType`).
- Mutations use `POST /create|/update|/delete` or `POST /{action}`; reads use `GET /search`, `GET /{id}`.
- Money: `BigDecimal` in BE, `number` in FE, currency VND, no decimals in UI.
- Date-times: ISO-8601 `LocalDateTime` strings.
- Errors: `BaseException("shop.xxx")`, key present in both `messages.properties` and `messages_en.properties`.

## 3. Security mapping

| Path prefix | Auth | Permission check |
| ----------- | ---- | ---------------- |
| `/shop/public/**` | none (added to `security.white-list`) | no |
| `/shop/me/**` | Keycloak JWT | `@SkipPermissionCheck`; data scoped to `SecurityUtils.getCurrentUsername()` |
| `/shop/seller/**` | JWT | `@SkipPermissionCheck`; service asserts caller owns an `ACTIVE` store (`shop.store.notActive`) |
| `/shop/shipper/**` | JWT | `@SkipPermissionCheck`; service asserts caller is an `ACTIVE` shipper (`shop.shipper.notActive`) |
| `/shop/admin/**` | JWT | normal core permission filter (menu/API permissions seeded in SQL) |

## 4. Data model (PostgreSQL, prefix `shop_`)

All tables have `id uuid pk` + core audit columns (`created_date, created_by, updated_date, updated_by`). `(sd)` = soft delete (`is_deleted, deleted_date, deleted_by`).

- `shop_category` — name, slug (unique), parent_id, icon, image_url, sort_order, status (`ACTIVE|INACTIVE`).
- `shop_store` (sd) — owner_username (unique), name, slug (unique), description, logo_url, banner_url, phone, address, province, status (`PENDING|ACTIVE|REJECTED|SUSPENDED`), reject_reason, rating_avg, rating_count, product_count, follower_count.
- `shop_store_follow` — store_id, username (unique pair).
- `shop_product` (sd) — store_id, category_id, name, slug, description (HTML-free text), price, original_price, stock, sold_count, view_count, rating_avg, rating_count, thumbnail_url, tags (comma list), status (`DRAFT|ACTIVE|HIDDEN|BANNED`), ban_reason, ar_type (`NONE|FACE_GLASSES|FACE_HAT|FACE_JEWELRY|BODY_TOP|BODY_BOTTOM|OBJECT`), ar_overlay_url (transparent PNG), ar_scale (numeric, default 1.0), ar_offset_y (numeric, default 0).
- `shop_product_image` — product_id, url, sort_order.
- `shop_product_variant` — product_id, name (e.g. "Đỏ / M"), price, stock, sku.
- `shop_cart_item` — username, product_id, variant_id (nullable), quantity, selected (bool). Unique (username, product_id, variant_id).
- `shop_wishlist` — username, product_id (unique pair).
- `shop_address` — username, receiver_name, phone, province, district, ward, detail, is_default.
- `shop_voucher` — store_id (null = platform voucher), code (unique), name, discount_type (`PERCENT|FIXED`), discount_value, max_discount, min_order_value, start_at, end_at, usage_limit, used_count, per_user_limit, status (`ACTIVE|INACTIVE`).
- `shop_voucher_usage` — voucher_id, username, order_id.
- `shop_order` — code (unique, `SBH` + yyMMdd + 6 random digits), buyer_username, store_id, receiver_name, receiver_phone, shipping_address (full text), province, subtotal, shipping_fee, store_discount, platform_discount, total, platform_fee, seller_income, shipper_fee, payment_method (`COD`), payment_status (`UNPAID|PAID`), status (see §5), note, cancel_reason, cancelled_by, shipper_username, failed_attempts, delivery_proof_url, confirmed_at, shipped_at, delivered_at, completed_at, cancelled_at, store_voucher_id, platform_voucher_id.
- `shop_order_item` — order_id, product_id, variant_id, product_name, variant_name, image_url, price, quantity, reviewed (bool).
- `shop_order_history` — order_id, action, status_before, status_after, actor, source (`BUYER|SELLER|SHIPPER|ADMIN|SYSTEM`), note.
- `shop_review` — order_item_id (unique), product_id, store_id, buyer_username, rating (1-5), comment, image_urls (comma list), seller_reply, replied_at.
- `shop_shipper` — username (unique), full_name, phone, id_number, vehicle_type, vehicle_plate, area_province, status (`PENDING|ACTIVE|REJECTED|SUSPENDED`), reject_reason.
- `shop_notification` — username, type (`ORDER|PROMOTION|SYSTEM|CHAT`), title, content, link, is_read.
- `shop_conversation` — buyer_username, store_id (unique pair), last_message, last_message_at, buyer_unread, seller_unread.
- `shop_message` — conversation_id, sender_username, sender_role (`BUYER|SELLER`), content, product_id (nullable, product card).
- `shop_search_log` — keyword (lower-cased, trimmed), username (nullable). Used for trending keywords.

## 5. Order lifecycle

```
PENDING --seller confirm--> CONFIRMED --seller ready--> READY_TO_SHIP --shipper accept--> PICKING
PICKING --shipper picked-up--> SHIPPING --shipper delivered--> DELIVERED --buyer confirm | auto 7 days--> COMPLETED
SHIPPING --shipper failed--> SHIPPING (failed_attempts+1); at 3 failures --> RETURNED (stock restored)
PENDING|CONFIRMED --buyer/seller/admin cancel--> CANCELLED (stock + voucher usage restored)
```

- Checkout splits selected cart items by store → one order per store, in one transaction. Stock is decremented at creation (pessimistic lock / `@Version`), `sold_count` incremented at COMPLETED.
- `shipping_fee`: flat by config `shop.order.shipping-fee` (default 30000), free when `subtotal >= shop.order.free-ship-threshold` (default 500000).
- On DELIVERED: `payment_status = PAID` (COD collected).
- On COMPLETED: `platform_fee = (subtotal - store_discount) * shop.order.platform-fee-percent / 100` (default 5); `seller_income = subtotal - store_discount - platform_fee`; `shipper_fee = shipping_fee * shop.order.shipper-fee-percent / 100` (default 80). Platform discount is absorbed by the platform.
- Each transition writes `shop_order_history` and a `shop_notification` to the affected user(s).
- Scheduled job (`@Scheduled`, hourly) auto-completes orders DELIVERED for more than `shop.order.auto-complete-days` (default 7).

## 6. Endpoints

### 6.1 Public — `/shop/public`

| Method | Path | Input | Output |
| ------ | ---- | ----- | ------ |
| GET | `/home` | – | `{ categories: CategoryNode[], trending: ProductCard[], bestSellers: ProductCard[], newArrivals: ProductCard[], flashDeals: ProductCard[] (largest % off), trendingKeywords: string[] }` |
| GET | `/category/tree` | – | `CategoryNode[]` `{id,name,slug,icon,imageUrl,children}` |
| GET | `/product/search` | `keyword, categoryId, storeId, minPrice, maxPrice, minRating, sort(relevance|newest|price_asc|price_desc|best_selling|popular), pageNumber, pageSize` | `PageResult<ProductCard>` (logs keyword to `shop_search_log`) |
| GET | `/product/suggest` | `keyword` | `string[]` (max 8 product names) |
| GET | `/product/{id}` | – | `ProductDetail` (increments view_count) |
| GET | `/product/{id}/related` | – | `ProductCard[]` (same category, max 12) |
| GET | `/product/{id}/reviews` | `rating, pageNumber, pageSize` | `PageResult<ReviewResponse>` + header summary via `/product/{id}/review-summary` |
| GET | `/product/{id}/review-summary` | – | `{ average, total, counts: {1..5} }` |
| GET | `/store/{id}` | – | `StoreResponse` |
| GET | `/file/**` | object key | streams the MinIO object (images, AR overlays) with cache headers |
| POST | `/chatbot/chat` | `{ messages: [{role:'user'|'assistant', content}] }` (max 20, last is user) | `{ reply: string, products: ProductCard[] }` |
| POST | `/auth/register` | `{ username, email, password, fullName, phone }` | – (creates Keycloak user + `sa_user` external user) |

`ProductCard` = `{ id, name, slug, thumbnailUrl, price, originalPrice, discountPercent, ratingAvg, ratingCount, soldCount, storeId, storeName, province, arType }`.
`ProductDetail` = ProductCard + `{ description, stock, categoryId, categoryName, images: string[], variants: [{id,name,price,stock}], tags: string[], arOverlayUrl, arScale, arOffsetY, store: StoreResponse }`.
`StoreResponse` = `{ id, name, slug, description, logoUrl, bannerUrl, province, ratingAvg, ratingCount, productCount, followerCount, createdDate }`.
`ReviewResponse` = `{ id, buyerName (masked), rating, comment, imageUrls, variantName, sellerReply, createdDate }`.

### 6.2 Account — `/shop/me`

| Method | Path | Input → Output |
| ------ | ---- | -------------- |
| GET | `/profile` | → `{ username, fullName, email, isSeller, storeId, storeStatus, isShipper, shipperStatus, unreadNotifications, cartCount }` |
| GET | `/cart` | → `{ groups: [{ store: {id,name}, items: [{ id, productId, variantId, name, variantName, imageUrl, price, quantity, stock, selected, available }] }] }` |
| POST | `/cart/add` | `{ productId, variantId?, quantity }` |
| POST | `/cart/update` | `{ id, quantity?, selected? }` |
| POST | `/cart/delete` | `{ ids: UUID[] }` |
| GET | `/wishlist` | → `ProductCard[]` |
| POST | `/wishlist/toggle` | `{ productId }` → `{ liked: boolean }` |
| GET | `/address` | → `AddressResponse[]` |
| POST | `/address/create` · `/address/update` · `/address/delete` | `AddressRequest` / `{id}` |
| GET | `/voucher/available` | `storeId?` → `VoucherResponse[]` (platform + that store, valid now) |
| POST | `/order/preview` | `{ addressId, storeVouchers: {storeId: code}, platformVoucherCode? }` → `{ orders: [{ storeId, storeName, items, subtotal, shippingFee, storeDiscount }], platformDiscount, total }` (uses selected cart items) |
| POST | `/order/create` | same input + `{ note: {storeId: string} }` → `{ orderIds: UUID[], codes: string[] }` |
| POST | `/order/buy-now` | `{ productId, variantId?, quantity }` → adds and selects only that item (then the client goes to checkout) |
| GET | `/order/search` | `status, keyword, pageNumber, pageSize` → `PageResult<OrderResponse>` |
| GET | `/order/{id}` | → `OrderDetailResponse` (items + history) |
| POST | `/order/cancel` | `{ id, reason }` |
| POST | `/order/confirm-received` | `{ id }` |
| POST | `/review/create` | `{ orderItemId, rating, comment, imageUrls }` |
| GET | `/notification/search` | `pageNumber, pageSize` → `PageResult<NotificationResponse>` |
| POST | `/notification/read` | `{ ids?: UUID[], all?: boolean }` |
| POST | `/store/follow` | `{ storeId }` → `{ followed }` |
| GET | `/conversation/list` | → `ConversationResponse[]` (buyer side) |
| GET | `/conversation/{id}/messages` | `after?` (ISO) → `MessageResponse[]` (marks read) |
| POST | `/conversation/start` | `{ storeId }` → `ConversationResponse` |
| POST | `/conversation/send` | `{ conversationId, content, productId? }` → `MessageResponse` |
| POST | `/file/upload` | multipart `file` (image, ≤5MB) → `{ url }` (used by reviews, seller, shipper) |
| POST | `/store/register` | `{ name, description, phone, address, province, logoUrl }` |
| POST | `/shipper/register` | `{ fullName, phone, idNumber, vehicleType, vehiclePlate, areaProvince }` |

`OrderResponse` = `{ id, code, store:{id,name}, status, paymentMethod, paymentStatus, total, itemCount, firstItem:{name,imageUrl,variantName,quantity,price}, createdDate }`.
`OrderDetailResponse` = all `shop_order` columns + `items[]` + `history[]` + `buyerName`, `shipperName`, `shipperPhone`.

### 6.3 Seller Center — `/shop/seller`

| Method | Path | Notes |
| ------ | ---- | ----- |
| GET / POST | `/store` · `/store/update` | own store |
| GET | `/product/search` | `keyword, status, categoryId, pageNumber, pageSize` → `PageResult<SellerProductResponse>` |
| GET | `/product/{id}` | full editable product |
| POST | `/product/create` · `/product/update` | `{ id?, categoryId, name, description, price, originalPrice, stock, images: string[], variants: [{id?,name,price,stock,sku}], tags, status (DRAFT|ACTIVE|HIDDEN), arType, arOverlayUrl, arScale, arOffsetY }`; thumbnail = first image; stock = sum of variant stock when variants exist |
| POST | `/product/delete` | `{ ids }` (soft delete) |
| GET | `/order/search` | `status, keyword, fromDate, toDate, pageNumber, pageSize` |
| GET | `/order/{id}` | |
| POST | `/order/confirm` · `/order/ready-to-ship` · `/order/cancel` | `{ id, reason? }` |
| GET / POST | `/voucher/search` · `/voucher/create` · `/voucher/update` · `/voucher/delete` | store vouchers |
| GET | `/review/search` · POST `/review/reply` | `{ id, reply }` |
| GET | `/conversation/list` · `/conversation/{id}/messages` · POST `/conversation/send` | seller side |
| GET | `/stats/overview` | `fromDate, toDate` → `{ revenue (seller_income COMPLETED), orderCount, pendingCount, toShipCount, cancelledCount, productCount, ratingAvg, viewCount }` |
| GET | `/stats/revenue-chart` | `fromDate, toDate, groupBy(DAY|MONTH)` → `[{ period, revenue, orders }]` |
| GET | `/stats/top-products` | `fromDate, toDate, limit` → `[{ productId, name, thumbnailUrl, quantity, revenue }]` |

### 6.4 Shipper — `/shop/shipper`

| Method | Path | Notes |
| ------ | ---- | ----- |
| GET | `/profile` | shipper row |
| GET | `/order/available` | READY_TO_SHIP without shipper, filter `province` (default own area), paged |
| GET | `/order/my` | `status` (PICKING|SHIPPING|DELIVERED|RETURNED), paged |
| GET | `/order/{id}` | only if assigned or available |
| POST | `/order/accept` | `{ id }` — guarded with optimistic lock so two shippers cannot take one order |
| POST | `/order/picked-up` | `{ id }` |
| POST | `/order/delivered` | `{ id, proofImageUrl }` |
| POST | `/order/failed` | `{ id, reason }` |
| GET | `/stats` | `fromDate, toDate` → `{ deliveredCount, failedCount, returnedCount, codCollected, earnings }` + `chart: [{ period, earnings, deliveries }]` |

### 6.5 Admin — `/shop/admin` (permission-checked)

| Method | Path | Notes |
| ------ | ---- | ----- |
| GET | `/category/tree` · POST `/category/create` · `/category/update` · `/category/delete` | |
| GET | `/store/search` · `/store/{id}` · POST `/store/approve` · `/store/reject` · `/store/suspend` · `/store/reactivate` | `{ id, reason? }` |
| GET | `/shipper/search` · POST `/shipper/approve` · `/shipper/reject` · `/shipper/suspend` · `/shipper/reactivate` | |
| GET | `/product/search` · `/product/{id}` · POST `/product/ban` · `/product/unban` | |
| GET | `/order/search` · `/order/{id}` · POST `/order/cancel` | |
| GET | `/voucher/search` · POST `/voucher/create` · `/voucher/update` · `/voucher/delete` | platform vouchers |
| GET | `/account/search` | `keyword, role(BUYER|SELLER|SHIPPER), status` → users joined with store/shipper info + `orderCount`, `totalSpent`; lock/unlock reuses core `sa/external-user` |
| GET | `/stats/overview` | `fromDate, toDate` → `{ gmv, platformRevenue (platform_fee − platform_discount, COMPLETED), completedOrders, cancelledOrders, newUsers, activeStores, activeShippers, pendingStores, pendingShippers, ordersByStatus: {status: count} }` |
| GET | `/stats/revenue-chart` | `fromDate, toDate, groupBy(DAY|MONTH)` → `[{ period, gmv, platformRevenue, orders }]` |
| GET | `/stats/top-stores` · `/stats/top-products` · `/stats/top-categories` | `fromDate, toDate, limit` |

## 7. AI features

### 7.1 Chatbot (`/shop/public/chatbot/chat`)

- Claude Messages API over HTTP (`RestClient`), model from `shop.ai.model` (default `claude-sonnet-5-5`), key `shop.ai.anthropic-api-key` (Consul only).
- Tools exposed to the model, executed against the real DB: `search_products(keyword?, category?, min_price?, max_price?, sort?, limit?)`, `get_trending_products(category?, limit?)`, `get_best_sellers(category?, limit?)`, `get_flash_deals(limit?)`, `list_categories()`, `get_trending_keywords()`.
- Trending score (last 7 days): `3 × units sold + 1 × views delta (view_count) + 2 × search hits on name`; implemented as one SQL query.
- Response products = union of product IDs returned by tool calls the model referenced (max 8). System prompt in Vietnamese, answers only about the shop, never invents products or prices.
- Fallback (no key, API error, timeout 20s): rule-based intent parser (price range "dưới 500k", "từ 1 đến 2 triệu", category names, keywords "xu hướng/hot/trend", "bán chạy", "giảm giá/sale", "rẻ") → same tool functions → templated Vietnamese reply.
- Rate limit per client IP via `CacheService`: `shop.ai.rate-limit-per-minute` (default 10) → `shop.chatbot.rateLimited`.

### 7.2 AR try-on (storefront only)

- Product `ar_type` decides the tracker: `FACE_*` → MediaPipe `FaceLandmarker`; `BODY_*` → `PoseLandmarker`; `OBJECT` → no tracking, the overlay is dragged / pinch-scaled / rotated by the user.
- Overlay image = `ar_overlay_url` (transparent PNG uploaded by the seller). `ar_scale` / `ar_offset_y` are seller-tuned calibration.
- Units: `ar_scale` multiplies the default overlay width given below (1.0 = default); `ar_offset_y` is a fraction of the overlay height, positive = moves the overlay down.
- Anchors: glasses → eyes (landmarks 33, 263), width = 2.1 × eye distance, rotated by eye line roll; hat → forehead (10) above head, width = 2.6 × face width (234–454); jewelry (necklace) → chin (152) shifted down; top → shoulders (11, 12) to hips (23, 24); bottom → hips (23, 24) to ankles (27, 28).
- Rendering on a `<canvas>` over a mirrored `<video>`; capture → PNG download; camera permission errors shown with retry. Runs fully in the browser; nothing is uploaded.

## 8. Configuration keys (Consul `config/core-app,local/data`)

```yaml
shop:
  ai:
    anthropic-api-key: ""          # empty = rule-based fallback only
    model: claude-sonnet-5-5
    rate-limit-per-minute: 10
  order:
    shipping-fee: 30000
    free-ship-threshold: 500000
    platform-fee-percent: 5
    shipper-fee-percent: 80
    auto-complete-days: 7
  storage:
    bucket: shop
  public-file-base: /shop/public/file/   # prefix returned in image URLs
  cors:
    allowed-origins:                     # browser origins allowed to call the API directly (empty = CORS filter off)
      - http://localhost:8088
      - http://localhost:3000
  # optional: ai.base-url (default https://api.anthropic.com), ai.timeout-seconds (default 20)

security:
  white-list:
    - /shop/public/**                    # required: the public endpoints are called without a token

spring:
  servlet:
    multipart:
      max-file-size: 6MB                 # the service limits uploads to 5 MB; Spring's default (1MB) is too small
      max-request-size: 6MB
```

## 9. Ports (local)

| Service | Port |
| ------- | ---- |
| Backend | 8200 |
| Admin web (`fe/apps/web`) | 8088 |
| Storefront (`fe/apps/storefront`) | 3000 (Vite proxy `/api` → 8200) |
| Keycloak | 8080 |
| PostgreSQL / Redis / Consul / MinIO | 5432 / 6379 / 8500 / 9000 (console 9001) |

## 10. Backend implementation details (agreed shapes, as implemented in `bom-shop` / `res-shop`)

Everything below refines the sections above; where it differs, this section is the behaviour of the backend.

### 10.1 Cross-cutting

- Dates: `fromDate`/`toDate` query params are `YYYY-MM-DD`; `after` (messages) and voucher `startAt`/`endAt` are `YYYY-MM-DDTHH:mm:ss`. Stats default to the last 30 days; ranges are inclusive of `toDate`.
- Paging params everywhere: `pageNumber` (1-based), `pageSize`, `fieldName`, `sortType` (default `createdDate` DESC). `status` of the order searches (`/me`, `/seller`, `/admin`, `/shipper/order/my`) accepts a comma-separated list (`CONFIRMED,READY_TO_SHIP,PICKING`).
- Image URLs are stored and returned as `/shop/public/file/{key}` (relative, no host, no `/api`). Absolute or gateway-prefixed URLs sent by clients are cut down to that form on write (thumbnail, images, logo, banner, `arOverlayUrl`, delivery proof, review images, category image). Other external URLs are kept as given. The upload endpoint detects the type from the file content (JPEG/PNG/WEBP/GIF, max 5 MB).
- Errors are `BaseException` keys (HTTP 400, `APP_DATA404` → 404). Validation messages are localized keys `shop.validation.*`.
- Notification `link` values are storefront routes: buyer `/account/orders/{orderId}`, seller `/seller/orders/{orderId}`, `/seller/reviews`, `/seller/products`, shipper `/shipper/orders/{orderId}`, `/shipper`, `/seller`, product `/products/{id}`. Notification text is rendered once, in Vietnamese.
- Concurrency: stock and voucher usage use atomic conditional `UPDATE`s (no oversell); every order transition takes a row lock (`SELECT ... FOR UPDATE`) and `shop_order` also has a `version` column (`@Version`), so two shippers cannot accept one order. `shop_order.cancelled_by` stores the source (`BUYER|SELLER|ADMIN|SYSTEM`).
- CORS: a servlet `CorsFilter` (before Spring Security) allows `shop.cors.allowed-origins` for GET/POST/OPTIONS. No change to core-security was needed.
- Registration: the phone number of `/shop/public/auth/register` is validated but not stored (`sa_user` has no phone column). The new `sa_user` is external (`is_internal=false`, `app_code=CORE`, `roles={}`).

### 10.2 Buyer (`/shop/me`)

- `GET /profile` → `{ username, fullName, email, isSeller, storeId, storeStatus, storeRejectReason, isShipper, shipperStatus, shipperRejectReason, unreadNotifications, cartCount }`. `POST /store/register` and `/shipper/register` can be re-sent while the status is `REJECTED` (resets to `PENDING`).
- `GET /store/{id}/follow-status` → `{ followed }`; `GET /store/followed` → `StoreResponse[]` (ACTIVE stores only).
- `AddressResponse` = `{ id, receiverName, phone, province, district, ward, detail, isDefault }`; `AddressRequest` is the same without `id` on create. `VoucherResponse` = `shop_voucher` columns in camelCase (`id, storeId, code, name, discountType, discountValue, maxDiscount, minOrderValue, startAt, endAt, usageLimit, usedCount, perUserLimit, status`).
- `POST /order/preview` items have the cart-line shape `{ id (cart item id), productId, variantId, name, variantName, imageUrl, price, quantity, stock, selected, available }`. A platform voucher is split pro rata over the orders; its usage is recorded on the first order.
- `ConversationResponse` = `{ id, storeId, storeName, storeLogoUrl, buyerUsername, buyerName, lastMessage, lastMessageAt, buyerUnread, sellerUnread }`. `MessageResponse` = `{ id, conversationId, senderUsername, senderRole, content, productId, product?: ProductCard, createdDate, mine }`. `GET .../messages` returns the last 100 (or everything after `after`) oldest first and marks the caller's side read.
- `OrderResponse` = contract fields + `receiverName, province, shippingFee, shipperFee, buyerUsername, buyerName, storeName, pickupAddress, storePhone, storeProvince, receiverPhone, shippingAddress, codAmount (= total while payment UNPAID, else 0), failedAttempts`. `OrderDetailResponse` = all `shop_order` columns + `storeName, pickupAddress, storePhone, storeProvince, codAmount, buyerName, shipperName, shipperPhone, items[], history[]`; `platformFee`/`sellerIncome` are filled only for seller/admin and `shipperFee` only for shipper/admin.

### 10.3 Seller Center (`/shop/seller`)

- `GET /store` and `POST /store/update` → store with `phone, address, province, logoUrl, bannerUrl, status, rejectReason` (`/store` works for any status; everything else needs an ACTIVE store).
- `GET /product/search` rows = `ProductCard + status, banReason, stock, createdDate`. `GET /product/{id}` returns all editable fields with `tags: string[]`, `images: string[]`, `variants: [{id,name,price,stock,sku}]`. Create/update accept `tags` as `string[]`. With variants the product price = lowest variant price and stock = sum of variant stocks.
- `GET /order/search` rows = `OrderResponse` (incl. `buyerName`, `receiverName`). `POST /order/confirm|ready-to-ship` take `{ id, reason? }`, `/order/cancel` requires `reason`.
- `GET /review/search` params: `rating, replied, pageNumber, pageSize`; `GET /voucher/search`: `status, keyword, pageNumber, pageSize`; `POST /voucher/delete {id}` (a voucher that was already used is deactivated instead of deleted).
- `GET /stats/overview` → `{ revenue, orderCount, pendingCount, toShipCount, confirmedCount, readyToShipCount, cancelledCount, productCount, ratingAvg, viewCount }`. `revenue` = sum of `seller_income` of orders COMPLETED in the range; `orderCount` = orders created in the range; `pendingCount`/`toShipCount`/`confirmedCount`/`readyToShipCount` are current backlogs (not range-bound). Charts are zero-filled; `period` is `YYYY-MM-DD` (DAY) or `YYYY-MM` (MONTH).

### 10.4 Shipper (`/shop/shipper`)

- Order rows and `GET /order/{id}` include the pickup info `pickupAddress, storePhone, storeProvince, storeName` plus `receiverName, receiverPhone, shippingAddress, province, codAmount, shippingFee, shipperFee, failedAttempts, status`.
- `GET /order/available`: `province` omitted = the shipper's own area; `allProvinces=true` lists every province. `GET /order/my`: `status` list, default `PICKING,SHIPPING,DELIVERED,RETURNED`.
- `POST /order/accept|picked-up` take `{ id }`; `/order/delivered` `{ id, proofImageUrl }`; `/order/failed` `{ id, reason }` (reason required; the 3rd failure returns the order and restores stock).
- `GET /stats` → `{ deliveredCount, failedCount, returnedCount, codCollected, earnings, chart: [{ period, earnings, deliveries }] }`. `earnings` = `shipper_fee` of orders COMPLETED in the range; the chart groups by delivery date (earnings are 0 until the order completes).

### 10.5 Admin (`/shop/admin`)

- Permission rows seeded in `db/03-seed.sql` (module `SHOP-ADMIN`, root url `/shop-admin`, `pathFolder` `/ShopAdministration/{Dashboard,Account,Category,Store,Shipper,Product,Order,Voucher}`). FUNCTION `buttonAction` codes: Account `lock`,`unlock` · Category `create`,`update`,`delete` · Store and Shipper `approve`,`reject`,`suspend`,`reactivate` · Product `ban`,`unban` · Order `cancel` · Voucher `create`,`update`,`delete` · Dashboard none. Account lock/unlock call `POST /sa/external-user/inactive|active` with `{ id }` (the role `ADMIN` holds the SA permissions too).
- `GET /account/search` (`keyword, role, status`) row: `{ userId (sa_user id), username, fullName, email, phone (shipper/store phone, else null), roles: [BUYER|SELLER|SHIPPER], status, orderCount, totalSpent, storeId, storeName, storeStatus, shipperId, shipperStatus, createdDate }`.
- Store row/detail = `StoreResponse + ownerUsername, phone, address, status, rejectReason`; shipper row = `shop_shipper` columns + `id`; product row = `ProductCard + status, banReason, stock, createdDate`; order list = `OrderResponse + buyerUsername`; order detail has `store{id,name}` and `storeName`; voucher = `shop_voucher` columns. Category tree nodes: `{ id, name, slug, icon, imageUrl, parentId, sortOrder, status, children }`.
- Bodies: category/voucher delete `{ id }`; create/update are the plain DTO (update includes `id`); moderation `{ id, reason? }`. `unban` returns the product as `HIDDEN` (the seller republishes it).
- Stats: `gmv` = sum of `total` of orders COMPLETED in the range; `platformRevenue` = sum of `platform_fee - platform_discount` of those; `ordersByStatus` counts orders created in the range. Top lists: top-stores `[{storeId,name,logoUrl,orders,gmv}]`, top-products `[{productId,name,thumbnailUrl,quantity,revenue}]`, top-categories `[{categoryId,name,quantity,revenue}]` (COMPLETED orders in the range, default limit 10, max 50).

### 10.6 Chatbot

- Optional `shop.ai.base-url`. The model is told to cite products as `[#<id>]`; the markers are stripped from the reply and the cited products (max 8, only ones returned by tools) become `products`. Tool loop: at most 5 model calls within `shop.ai.timeout-seconds`, otherwise the rule-based engine answers. The trending score uses the cumulative `view_count` (there is no per-day view log).

## 11. Return leg and shop promotions

### 11.1 Return leg (status `RETURNING`)

```
SHIPPING --3rd failed attempt--> RETURNING (shipper carries the goods back; stock NOT restored yet)
RETURNING --seller confirm-returned--> RETURNED (stock restored)
```

- New `OrderStatus.RETURNING` (between `SHIPPING` and `RETURNED`); `shop_order.status` CHECK gains `RETURNING`. Allowed transitions: `SHIPPING → DELIVERED | RETURNING`, `RETURNING → RETURNED`. Stock is restored only on `RETURNED`.
- History actions: the 3rd failure writes `RETURNING` (source SHIPPER, note = reason); the seller's confirmation writes `RETURN_RECEIVED` (source SELLER).
- Notifications: on `RETURNING` buyer + seller ("Đơn {code} đang được hoàn về shop"); on `RETURNED` buyer + shipper.
- Seller: `POST /shop/seller/order/confirm-returned` `{ id }` (order of the own store, status `RETURNING`; otherwise `shop.order.invalidTransition`).
- Admin may also force it: `POST /shop/admin/order/confirm-returned` `{ id }` (button action `confirmReturned` on module Order).
- Shipper `GET /order/my`: status accepts `RETURNING`; default list `PICKING,SHIPPING,RETURNING,DELIVERED,RETURNED`. `GET /order/{id}` works for `RETURNING` orders assigned to the caller. Stats `returnedCount` counts orders that entered `RETURNING` in the range.
- Status labels (vi): PICKING "Chờ lấy hàng", SHIPPING "Đang giao", RETURNING "Đang hoàn hàng", RETURNED "Đã hoàn hàng".

### 11.2 Shop promotions (time-boxed % off on chosen products)

Tables (new migration `db/04-promotion-returning.sql`, idempotent; it also widens the order status CHECK):

- `shop_promotion` (sd) — store_id, name (≤150), discount_percent (int 1–90), start_at, end_at (`end_at > start_at`), status (`ACTIVE|INACTIVE`), audit columns, is_deleted.
- `shop_promotion_product` — promotion_id, product_id, unique (promotion_id, product_id); index on product_id.

Rules:

- A promotion is *running* when `status = ACTIVE`, not deleted, and `start_at <= now < end_at`.
- A product may belong to several promotions, but their time windows must not overlap for that product (create/update → `shop.promotion.overlap` with the product name). Products must belong to the seller's store.
- Effective price = `round(price * (100 - discount_percent) / 100)` to whole VND (HALF_UP). It applies to the product price and to every variant price.
- Where the effective price is used: every `ProductCard` / `ProductDetail` (incl. variants), cart lines, `/order/preview`, `/order/create` (order item `price` snapshot = effective price; voucher min-order and subtotal use it), chatbot product cards, and `minPrice`/`maxPrice` filters are still on the base column (documented deviation). Sort by price uses the base column.
- `ProductCard` / `ProductDetail` while a promotion is running: `price` = effective price, `originalPrice` = base price, `discountPercent` = promotion percent, plus new optional fields `promotionName`, `promotionEndAt` (`YYYY-MM-DDTHH:mm:ss`). Without a running promotion, behaviour is unchanged (`originalPrice` = the manual original price, `promotionName`/`promotionEndAt` null). Home `flashDeals` takes running promotions into account.
- Seller endpoints (`/shop/seller`, ACTIVE store required):

| Method | Path | Input → Output |
| ------ | ---- | -------------- |
| GET | `/promotion/search` | `keyword, state (UPCOMING|RUNNING|ENDED|INACTIVE), pageNumber, pageSize` → `PageResult<PromotionResponse>` |
| GET | `/promotion/{id}` | → `PromotionResponse` with `products: SellerProductRow[]` |
| POST | `/promotion/create` · `/promotion/update` | `{ id?, name, discountPercent, startAt, endAt, status, productIds: UUID[] (1..200) }` |
| POST | `/promotion/delete` | `{ id }` (soft delete) |

`PromotionResponse` = `{ id, name, discountPercent, startAt, endAt, status, state (UPCOMING|RUNNING|ENDED|INACTIVE), productCount, products?: [{ id, name, thumbnailUrl, price, effectivePrice, stock, status }], createdDate }`. Validation keys: `shop.promotion.percentRange`, `shop.promotion.timeRange`, `shop.promotion.productsRequired`, `shop.promotion.overlap`.

Backend implementation notes (additions to the above, no field renames):

- Extra validation key `shop.promotion.productInvalid`: a product id is unknown, deleted or belongs to another store.
- The overlap check only considers `ACTIVE` promotions and is skipped when the saved promotion is `INACTIVE`; creating/updating takes a row lock on the seller's store so two saves cannot both pass it. Update replaces the product set with `productIds`.
- `state` precedence: `INACTIVE` (status) wins over the time window; `ENDED` = `now >= end_at`. `GET /promotion/search` `state` filter uses the same rule.
- Seller/admin product list rows (`/seller/product/search`, `/admin/product/*`) keep the stored base `price`/`originalPrice`/`discountPercent` (they are edit views); only public cards, detail, cart, checkout and chatbot use the effective price.
- `flashDeals` ranks a candidate set of at most 200 visible products (manual discount or running promotion) by final `discountPercent`, then `soldCount`.
- Trending units sold (chatbot/home) exclude orders in `RETURNING` as well as `RETURNED`/`CANCELLED`.
- Shipper stats `returnedCount` = number of `RETURNING` history rows of the shipper's orders in the range. `shop.notify.order.returned.seller` was dropped (on `RETURNED` only buyer and shipper are notified); new keys: `shop.notify.order.returning`, `.returning.seller`, `.returned.shipper`.
- Admin permission row (module `SHOP-ADMIN`, menu Orders, FUNCTION `confirmReturned`, `POST /shop/admin/order/confirm-returned`) is seeded by `db/04-promotion-returning.sql` and granted to role `ADMIN`.

## 12. Buyer return & refund (trả hàng / hoàn tiền)

Whole-order returns only. Payment is COD, so the refund is a manual bank transfer recorded in the system (no money moves through it).

### 12.1 Lifecycle

```
DELIVERED --buyer request (within shop.order.return-window-days of delivered_at)--> RETURN_REQUESTED  [request REQUESTED]
RETURN_REQUESTED [REQUESTED] --seller approve | no seller answer in shop.order.return-response-days--> RETURN_APPROVED
RETURN_REQUESTED [REQUESTED] --seller reject (reason)--> RETURN_REQUESTED [request REJECTED]
RETURN_REQUESTED [REJECTED] --buyer dispute (reason, within shop.order.return-dispute-days)--> RETURN_REQUESTED [DISPUTED]
RETURN_REQUESTED [REJECTED, no dispute in time] --system--> COMPLETED
RETURN_REQUESTED [DISPUTED] --admin approve--> RETURN_APPROVED ; --admin reject--> COMPLETED
RETURN_REQUESTED [REQUESTED|REJECTED] --buyer withdraws--> COMPLETED
RETURN_APPROVED --a shipper accepts the return pickup--> RETURN_SHIPPING  (shop_order.return_shipper_username)
RETURN_SHIPPING --seller confirms goods received--> RETURN_RECEIVED  (stock restored)
RETURN_RECEIVED --seller or admin marks refunded (proof image?, note?)--> REFUNDED  (terminal)
```

- New order statuses: `RETURN_REQUESTED, RETURN_APPROVED, RETURN_SHIPPING, RETURN_RECEIVED, REFUNDED` (status CHECK widened). The auto-complete job keeps handling only `DELIVERED`; a new scheduled step (same hourly job) applies the two timeouts above.
- Return request statuses (`shop_return_request.status`): `REQUESTED, APPROVED, REJECTED, DISPUTED, CANCELLED, CLOSED` (`APPROVED` when the order goes to `RETURN_APPROVED`; `CLOSED` when the order reaches `COMPLETED` after reject/dispute-rejected; `CANCELLED` when the buyer withdraws). The request keeps its `APPROVED` status through shipping/received/refunded (the order status tells the progress).
- Money: `refund_amount` = order `total`. A `REFUNDED` order has `platform_fee = 0`, `seller_income = 0`, and `shipper_fee` of the original delivery shipper is set as on COMPLETED (the delivery was done); the return trip is not paid. Seller revenue / admin GMV keep counting only COMPLETED; shipper `earnings` = `shipper_fee` of orders COMPLETED **or REFUNDED** in the range (by completed_at / refunded_at). `sold_count` is not incremented for refunded orders.
- History actions: `RETURN_REQUEST, RETURN_APPROVE, RETURN_AUTO_APPROVE, RETURN_REJECT, RETURN_DISPUTE, RETURN_RESOLVE_APPROVE, RETURN_RESOLVE_REJECT, RETURN_WITHDRAW, RETURN_AUTO_CLOSE, RETURN_ACCEPT (shipper), RETURN_GOODS_RECEIVED, REFUND`. Notifications on every step to the affected parties (buyer, seller, shipper of the return, admin is not notified).
- Config (`shop.order.*`): `return-window-days` 7, `return-response-days` 3, `return-dispute-days` 3.

### 12.2 Data

- `shop_return_request` — id, order_id (unique), buyer_username, reason_code (`DAMAGED|WRONG_ITEM|NOT_AS_DESCRIBED|MISSING_PARTS|OTHER`), description (≤1000), image_urls (text, comma list, 1–6 images required), bank_name (≤100), bank_account_no (≤30, digits), bank_account_name (≤100), refund_amount, status, seller_note (reject reason / approve note), dispute_reason, admin_note, refund_proof_url, refund_note, requested_at, responded_at, disputed_at, resolved_at, refunded_at, refunded_by, audit columns.
- `shop_order` gains `return_shipper_username varchar(50)`, `refunded_at timestamp`. Migration `db/05-return-refund.sql` (idempotent; widens the status CHECK again, adds the table/columns, seeds admin permissions).

### 12.3 Endpoints

Buyer `/shop/me`:

| Method | Path | Input |
| ------ | ---- | ----- |
| POST | `/order/return/request` | `{ orderId, reasonCode, description, imageUrls: string[] (1..6), bankName, bankAccountNo, bankAccountName }` |
| POST | `/order/return/dispute` | `{ orderId, reason }` |
| POST | `/order/return/withdraw` | `{ orderId }` |

Seller `/shop/seller` (own store):

| Method | Path | Input |
| ------ | ---- | ----- |
| POST | `/order/return/approve` | `{ id (orderId), note? }` |
| POST | `/order/return/reject` | `{ id, reason }` (reason required) |
| POST | `/order/return/confirm-received` | `{ id }` |
| POST | `/order/return/refunded` | `{ id, proofImageUrl?, note? }` |

Admin `/shop/admin` (permission-checked, module Order, button actions `resolveReturn`, `markRefunded`):

| Method | Path | Input |
| ------ | ---- | ----- |
| POST | `/order/return/resolve` | `{ id, approve: boolean, note }` (only request `DISPUTED`) |
| POST | `/order/return/refunded` | `{ id, proofImageUrl?, note? }` |

Shipper `/shop/shipper`:

- `GET /order/available` gains `type` (`DELIVERY` default | `RETURN` | `ALL`). Return jobs are `RETURN_APPROVED` orders without `return_shipper_username`; their province filter is the buyer's `province` (the pickup is at the buyer).
- `POST /order/accept` `{ id }` also accepts a return job (`RETURN_APPROVED` → `RETURN_SHIPPING`, sets `return_shipper_username`; same row lock / already-taken rule).
- `GET /order/my` status accepts `RETURN_SHIPPING` (orders whose `return_shipper_username` = caller); default list adds it. `GET /order/{id}` allows the return shipper and available return jobs.
- Rows/detail gain `jobType` (`DELIVERY|RETURN`). For `RETURN` jobs the pickup is the buyer (`receiverName/receiverPhone/shippingAddress`) and the drop-off is the store (`storeName/storePhone/pickupAddress`); `codAmount` = 0.

Responses:

- `OrderDetailResponse` (buyer, seller, admin, shipper) gains `returnRequest?: ReturnRequestResponse` and `refundedAt`, `returnShipperUsername`, plus `returnDeadline` (delivered_at + window, only while DELIVERED) and `canRequestReturn` (buyer view).
- `ReturnRequestResponse` = `{ id, reasonCode, description, imageUrls: string[], bankName, bankAccountNo, bankAccountName, refundAmount, status, sellerNote, disputeReason, adminNote, refundProofUrl, refundNote, requestedAt, respondedAt, disputedAt, resolvedAt, refundedAt, responseDeadline, disputeDeadline }`. `bankAccountNo` is shown in full only to the buyer, seller and admin (shipper gets no `returnRequest` bank fields).
- Order search lists accept the new statuses in `status`. Admin order search accepts `returnStatus` (e.g. `DISPUTED`) to list disputes.
- Errors: `shop.return.windowExpired`, `shop.return.notAllowed`, `shop.return.imagesRequired`, `shop.return.bankInvalid`, `shop.return.reasonRequired`, `shop.return.disputeExpired`, `shop.order.invalidTransition`.

Status labels (vi): RETURN_REQUESTED "Yêu cầu trả hàng", RETURN_APPROVED "Đã chấp nhận trả hàng", RETURN_SHIPPING "Đang gửi trả", RETURN_RECEIVED "Shop đã nhận hàng trả", REFUNDED "Đã hoàn tiền". Request statuses: REQUESTED "Chờ shop phản hồi", REJECTED "Shop từ chối", DISPUTED "Đang khiếu nại", APPROVED "Đã chấp nhận", CANCELLED "Đã rút yêu cầu", CLOSED "Đã đóng". Reasons: DAMAGED "Hàng bị hư hỏng", WRONG_ITEM "Giao sai hàng", NOT_AS_DESCRIBED "Không đúng mô tả", MISSING_PARTS "Thiếu hàng / phụ kiện", OTHER "Lý do khác".

Backend implementation notes (additions to the above, no field renames):

- `OrderResponse` list rows also carry `jobType` and `returnStatus` (the return request status, `null` when none). `jobType` is `RETURN` while the order is `RETURN_APPROVED` / `RETURN_SHIPPING`, otherwise `DELIVERY`; the `type` filter of `/shipper/order/available` accepts `DELIVERY`, `RETURN`, `ALL`.
- `responseDeadline` is only set while the request is `REQUESTED`; `disputeDeadline` (= `responded_at` + dispute days) only while it is `REJECTED`; both are `null` otherwise. `returnDeadline` is only set while the order is `DELIVERED`.
- Validation: a missing `reasonCode` → `shop.return.reasonRequired`; images that are empty, more than 6, or contain a comma → `shop.return.imagesRequired`; any invalid bank field → `shop.return.bankInvalid`. Seller reject reason, buyer dispute reason and admin resolve `note` are required (`shop.return.reasonRequired`). A request/order in the wrong state → `shop.return.notAllowed` (request state) or `shop.order.invalidTransition` (order status). Withdrawing a `DISPUTED` request is not allowed.
- `/shipper/order/my`: delivery-side statuses match `shipper_username`, `RETURN_SHIPPING` matches `return_shipper_username`. The shipper `detail` also allows the order's delivery shipper; bank fields of `returnRequest` are `null` for every shipper view.
- Shipper `codCollected` also counts orders that moved on to the return/refund statuses (the COD was collected at delivery); `earnings` uses `completed_at` for `COMPLETED` and `refunded_at` for `REFUNDED`. Trending units sold also exclude `RETURN_RECEIVED` and `REFUNDED`.
- Notifications: on `RETURN_RECEIVED` the return shipper is notified; on `REFUNDED` the buyer, the delivery shipper (earnings recorded) and, when an admin marked it, the seller. The return history action for the seller confirming the goods is `RETURN_GOODS_RECEIVED`; the older `RETURN_RECEIVED` action stays on the failed-delivery leg (`RETURNING -> RETURNED`).
- Scheduled timeouts run in the same hourly job; each order is processed in its own transaction after re-checking its status under the row lock.
