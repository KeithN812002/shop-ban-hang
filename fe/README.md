# Core Frontend Starter

A domain-agnostic frontend starter built with **React 19**, **TypeScript**, **Vite 7** and a **pnpm + Turborepo** monorepo. It ships the shared UI library, authentication (Keycloak SSO), menu/permission-driven routing and the System Administration screens (internal users, external users, roles, permissions/menus, email outbox, email templates). Business modules are added by each project on top.

## Prerequisites

- Node.js >= 20
- pnpm 10.4.1 (`packageManager` is pinned in `package.json`)

## Repository layout

```text
.
├── apps/
│   └── web/                      # The Vite application (package name: "web")
│       ├── src/
│       │   ├── config/           # env.ts + extension registries (moduleRegistry, menuBadgeRegistry, registerModules)
│       │   ├── constants/        # Core enums/options (PermissionTypeEnum, StatusEnum, email outbox options, ...)
│       │   ├── hooks/            # Auth, menu, permission hooks
│       │   ├── i18n/             # i18n config + one locale folder per domain
│       │   ├── lib/              # axios (auth interceptor), keycloak, storage, themes
│       │   ├── pages/            # Screens, resolved dynamically from backend menu entries
│       │   │   └── SystemAdministration/   # InternalUser, ExternalUser, Role, Permission, EmailOutbox, EmailTemplate
│       │   ├── providers/        # Auth, menu data, menu permission providers
│       │   ├── routes/           # Router entry points (do not add page files here)
│       │   ├── services/         # auth, menu, lookup (role options)
│       │   ├── shared/           # DashboardLayout, user menu, permission pickers, UI showcase
│       │   └── types/            # ApiResponse / PaginatedResponse, menu types
│       ├── public/               # favicon + logo placeholders (replace per project)
│       ├── k8s/  Dockerfile  nginx.conf  scripts/
│       └── .env.example          # Env keys only (no values)
├── packages/
│   ├── ui/                       # @workspace/ui - shared component library
│   ├── lib/                      # @workspace/lib - shared API/validation helpers
│   ├── eslint-config/
│   └── typescript-config/
├── turbo.json  pnpm-workspace.yaml  package.json
└── CLAUDE.md  CONVENTIONS.md  EXTRACTION_NOTES.md
```

## Installation

1. Install Node.js >= 20, then enable the pinned pnpm version:

    ```bash
    corepack enable          # uses "packageManager": "pnpm@10.4.1"
    ```

2. Install dependencies from this folder (`fe/`). `lefthook install` runs automatically through the `prepare` script and sets up the git hooks:

    ```bash
    pnpm install
    ```

3. Create the env file and fill in the values (see [Environment variables](#environment-variables)):

    ```bash
    cp apps/web/.env.example apps/web/.env   # never commit .env
    ```

    Example for a local setup:

    ```dotenv
    FIS_SERVER_PORT=8088
    FIS_API_BASE_URL=http://localhost:8200
    FIS_APP_CODE=<app-code>
    FIS_PUBLIC_URL=/
    FIS_ENV_LABEL=LOCAL
    FIS_SSO_URL=http://localhost:8080
    FIS_REALM=<realm>
    FIS_CLIENT_ID=<client-id>
    FIS_REDIRECT_URL=http://localhost:8088/api/sso/callback
    ```

4. Make sure the backend is running and reachable (see [`../be/README.md`](../be/README.md)). The Keycloak client must list `FIS_REDIRECT_URL` as a valid redirect URI, and `FIS_CLIENT_ID` must be the same client the backend uses (`keycloak.resource.app`), because the backend exchanges the authorization code.

> **CORS:** the backend has no CORS configuration and the Vite dev server has no proxy. If `FIS_API_BASE_URL` is on a different origin than the frontend (for example `localhost:8200` vs `localhost:8088`), the browser blocks the calls. Put both behind the same origin (gateway or reverse proxy), or add CORS on the backend or a `server.proxy` entry in `apps/web/vite.config.js`.

## Running

```bash
pnpm dev                 # turbo dev -> vite on FIS_SERVER_PORT (default 8088)
```

Open `http://localhost:8088`. The app redirects to Keycloak; after login it returns to `FIS_REDIRECT_URL` and loads the menus the backend grants to the user.

Production build and preview:

```bash
pnpm build                          # output: apps/web/dist
pnpm --filter web serve             # vite preview of the build
pnpm --filter web build:production  # build with apps/web/.env.production
```

Docker and Kubernetes: see [`apps/web/README.md`](apps/web/README.md).

### Scripts

| Command                                        | Where      | What it does                              |
| ---------------------------------------------- | ---------- | ----------------------------------------- |
| `pnpm dev`                                     | root       | Run all dev servers through Turborepo     |
| `pnpm build`                                   | root       | Build every package/app                   |
| `pnpm lint`                                    | root       | Lint packages that define a `lint` script |
| `pnpm format`                                  | root       | Prettier write                            |
| `pnpm build`                                   | `apps/web` | `vite build && tsc --noEmit`              |
| `pnpm build:stagging` / `:uat` / `:production` | `apps/web` | Same, with `--mode`; loads `.env.<mode>`  |
| `pnpm serve`                                   | `apps/web` | `vite preview`                            |
| `npx tsc --noEmit`                             | `apps/web` | Typecheck only                            |

> Typecheck with `tsc --noEmit`. Do not use `tsc -b`: it writes generated `.js`/`.d.ts` files into `src/`.

## Environment variables

All client variables use the `FIS_` prefix (`envPrefix` in `vite.config.js`) and are read through `src/config/env.ts`. Keys are listed in `apps/web/.env.example`; values are never committed.

| Key                                                                | Purpose                                                          |
| ------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `FIS_SERVER_PORT`                                                  | Dev/preview port (default 8088)                                  |
| `FIS_API_BASE_URL`                                                 | Backend gateway base URL                                         |
| `FIS_APP_CODE`                                                     | Application code                                                 |
| `FIS_PUBLIC_URL`                                                   | Public base path (router basepath and Vite `base`, default `/`)  |
| `FIS_SSO_URL` / `FIS_REALM` / `FIS_CLIENT_ID` / `FIS_REDIRECT_URL` | Keycloak SSO                                                     |
| `FIS_SOCKET_URL` / `FIS_SOCKET_PATH` / `FIS_ENABLE_SOCKET`         | Optional Socket.io                                               |
| `FIS_BLOCKED_FUNCTIONS`                                            | Comma-separated action codes to hide                             |
| `FIS_ENV_LABEL`                                                    | Environment label                                                |

## How routing works

Pages are not file-based routes. `src/routes/$.tsx` resolves the current URL to a backend menu entry and lazy-loads `src/pages/<PathFolder>` (`import.meta.glob('../pages/**/*.tsx')`). A screen is reachable only when the backend returns a menu entry (and permission) whose `pathFolder` points at it.

## Add a new module / screen

1. **Screen files** under `apps/web/src/pages/{DomainGroup}/{Screen}/` following the layout in `CONVENTIONS.md` (`index.tsx` with `export default`, `hooks/`, `components/`, `services/`, `types/`). Copy `pages/SystemAdministration/Role` as the template.
2. **i18n**: create `src/i18n/locales/{domain}/vi.json` and `en.json`, then import and register them in `src/i18n/locales/index.ts`.
3. **Backend menu entry + permission**: create the menu entry (type `ROOT` for a module, `GROUP`, `MENU`, `PAGE`) with `url` and `pathFolder` = the folder path under `pages/` (for example `/Orders/OrderList`), then grant it to a role through the Permission and Role screens. Without it the screen never appears.
4. **Optional module dashboard**: register a lazy dashboard for the module root URL in `src/config/registerModules.ts`:

    ```ts
    import { lazy } from 'react'
    import { registerModuleDashboard } from '@/config/moduleRegistry'

    registerModuleDashboard('/orders', {
        component: lazy(() => import('@/pages/Orders/Dashboard')),
        fallbackTitle: 'Orders',
    })
    ```

5. **Optional sidebar badges**: register a hook that returns badges keyed by the normalized menu `PathFolder`:

    ```ts
    import { registerMenuBadgeProvider } from '@/config/menuBadgeRegistry'

    registerMenuBadgeProvider(menuTree => useOrderBadges(menuTree)) // -> { 'orders/inbox': { count, className } }
    ```

6. **Module card colours/pattern** on the module picker (`routes/modules.tsx`, `components/Common/ModuleCardPattern.tsx`) are keyed by the module root URL segment; add an entry there for a custom look.
7. **Email templates / events**: add event types to `src/constants/options/email-outbox-event-type-options.ts` (and a module to `EmailTemplateModuleEnum` plus `pages/SystemAdministration/EmailTemplate/utils/emailTemplateScope.ts` if the module owns its own templates).

## Backend contract assumed by the core

The core expects the backend System Administration module with unchanged paths and response shapes:

- `sa/auth/*`: `exchange-auth-code`, `refresh-token`, `me`, `permissions`, `request-otp`, `resend-otp`, `confirm-change-password`, `password-policy`, `logout`
- `sa/internal-user/*`, `sa/external-user/*`, `sa/role/*` (including `options`)
- `sa/permission/*` (menus are permissions of type ROOT/GROUP/MENU/PAGE/FUNCTION/API, including export/import)
- `sa/email-outbox/*`, `sa/email-template/{type}/*`

See `apps/web/src/services` and `apps/web/src/pages/SystemAdministration/*/services` for the exact calls.

## Further reading

- `CONVENTIONS.md` - coding standard and screen anatomy
- `CLAUDE.md` - short checklist for AI assistants
- `EXTRACTION_NOTES.md` - what was removed from the source project and how to extend the core
- `apps/web/README.md` - app-level notes (Docker, Kubernetes)
