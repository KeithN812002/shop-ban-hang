# Storefront (`apps/storefront`)

Customer-facing shop (buyer) and host app for the Seller Center (`/seller/*`) and shipper area (`/shipper/*`).
React 19, TypeScript, Vite 7, TanStack Router (file-based) + Query, Tailwind v4, i18next (vi default + en).
API contract: [`docs/shop-contract.md`](../../../docs/shop-contract.md).

## Run

```bash
cd fe
pnpm install
cp apps/storefront/.env.example apps/storefront/.env   # fill the FIS_* values, never commit .env
pnpm --filter storefront dev                            # http://localhost:3000
```

| Command | What |
| ------- | ---- |
| `pnpm dev` | dev server, port 3000 (strict), `/api/*` proxied to `FIS_API_BASE_URL` (default `http://localhost:8200`, `/api` stripped) |
| `pnpm build` | `vite build && tsc --noEmit` |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | vitest (AR anchor math, smoothing, gestures, camera errors) |

Env keys (`FIS_` prefix, see `.env.example`): `FIS_SERVER_PORT`, `FIS_API_BASE_URL`, `FIS_API_PREFIX`, `FIS_SSO_URL`, `FIS_REALM`, `FIS_CLIENT_ID`, `FIS_REDIRECT_URL`, `FIS_AR_WASM_URL`, `FIS_AR_FACE_MODEL_URL`, `FIS_AR_POSE_MODEL_URL`.

### Login

Keycloak authorization code flow, same as `apps/web`: `/login` -> Keycloak -> **`/auth/callback`** (default redirect URI `<origin>/auth/callback`, override with `FIS_REDIRECT_URL`) -> `POST sa/auth/exchange-auth-code` -> tokens in `lib/storage.ts`. 401 -> single-flight `sa/auth/refresh-token` and replay; logout -> `sa/auth/logout` + Keycloak end-session.

## Structure

```text
src/
  main.tsx                 router + providers
  routes/                  file-based routes (routeTree.gen.ts is generated, never edit)
  config/env.ts            the only reader of import.meta.env
  lib/                     http (axios + unwrap + errors), storage, keycloak, format, media, notify, query-client
  hooks/                   use-profile, use-debounce, use-popover
  providers/auth-provider  useAuth()
  types/                   api.ts (Response/PageResult), shop.ts (contract DTOs)
  components/
    ui/                    Button, Field/Input/Select/Textarea, Modal, EmptyState/ErrorState/Spinner, Pagination,
                           RatingStars, Price, QuantityInput, SmartImage, Carousel, TabBar
    common/                ImageUploader, route fallbacks
    product/               ProductCard, ProductGrid, skeletons
    order/                 OrderStatusBadge
    auth/                  RequireAuth, RoleGate, RegistrationStatusCard
    layout/                Header, Footer, SearchBox, CategoryMenu, NotificationBell, AccountMenu, LanguageSwitch
  features/<area>/         api.ts (endpoints) + queries.ts (key factory + hooks) + components/
    catalog, cart, orders, account, chat, chatbot, product, ar-try-on, auth
    seller/, shipper/      owned by the Seller / Shipper work
  i18n/                    config.ts + locales/**
```

### Routes

Public: `/`, `/search`, `/product/$id`, `/try-on/$id`, `/store/$id`, `/login`, `/register`, `/auth/callback`.
Authenticated: `/cart`, `/checkout`, `/checkout/success`, `/account` (`/addresses`, `/orders`, `/orders/$id`, `/wishlist`, `/notifications`, `/chat`).
Partner areas: `/seller` and `/shipper` layouts (guard, see below), `/seller/register`, `/shipper/register`.

## Adding Seller / Shipper pages

1. Create route files under `src/routes/seller/*` or `src/routes/shipper/*` (they render inside the guard layout's `<Outlet/>`).
   The guard (`components/auth/role-gate.tsx`) sends anonymous users to login, non-ACTIVE users to `/<role>/register`
   (form or PENDING / REJECTED / SUSPENDED card) and ACTIVE users through. `/<role>/register` redirects ACTIVE users to `/<role>`.
2. Put endpoints in `features/seller/api.ts` using `apiGet` / `apiPost` / `apiUpload` from `@/lib/http`; query keys under your own root.
3. i18n: drop `src/i18n/locales/seller/vi.json` + `en.json` (any depth, `vi.json` / `en.json` or `<name>.vi.json` / `<name>.en.json`).
   Every JSON is **auto-loaded and deep-merged** into the single `translation` namespace, so each file must carry its own top-level key
   (`{ "seller": { ... } }`). No registration code. Interpolation `count` must be a number (i18next typing): use another variable name for pre-formatted strings.
4. Reuse `useProfile()`, `ImageUploader`, `Pagination`, `EmptyState`, `OrderStatusBadge`, `Price`, `Modal`, `Field` ...

## Shared building blocks

- `useProfile()` -> `{ isAuthenticated, isLoading, isError, profile, isSeller, isShipper, storeStatus, shipperStatus, cartCount, unreadNotifications, refetch }`.
  `isSeller` / `isShipper` mean status `ACTIVE`; `storeStatus` / `shipperStatus` are the raw `PENDING | ACTIVE | REJECTED | SUSPENDED | null`.
- `apiGet<T>(url, params)`, `apiPost<T>(url, body)`, `apiUpload<T>(url, file)`: unwrap `Response<T>`, throw `ApiError` (server message, localised via `accept-language`).
  Mutations toast errors globally (`meta: { silent: true }` to opt out).
- Account-scoped query keys live under the `['me']` root (`meKeys`) so logout drops them in one call.
- `notify.success|error|info(title, description?)` wraps the shared `@workspace/ui` toast.

## AR try-on (`features/ar-try-on`)

Contract section 7.2. `anchors.ts` (pure placement math, unit-tested), `smoothing.ts` (adaptive landmark filter), `gestures.ts`
(pinch / wheel math), `camera.ts` (getUserMedia + error classification), `landmarkers.ts` (lazy MediaPipe `FaceLandmarker` /
`PoseLandmarker`, GPU with CPU fallback), `renderer.ts` (draw + PNG capture), `ar-try-on.tsx` (UI).
MediaPipe JS is a dynamic import; wasm comes from jsdelivr at the **installed package version** (injected by `vite.config.js`),
models from `storage.googleapis.com/mediapipe-models`. The preview is mirrored for the front camera, overlay positions are mirrored in
math so overlay art is not flipped. `arScale` multiplies the contract size, `arOffsetY` is a vertical shift as a fraction of the
overlay height (positive = down); both start the sliders. If the model cannot load, the page falls back to manual drag / pinch / wheel mode.
