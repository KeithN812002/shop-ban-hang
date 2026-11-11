# web

The Vite application of the core frontend starter. See the repository root `README.md` for the full layout, scripts, environment keys and the "add a new module" guide.

## Quick start

Full installation steps (pnpm, `.env` values, Keycloak client, CORS note) are in [`../../README.md`](../../README.md#installation).

```bash
cd ../..                      # fe/ (workspace root)
corepack enable
pnpm install
cd apps/web
cp .env.example .env          # fill in values, never commit .env
pnpm dev                      # vite on FIS_SERVER_PORT (default 8088)
```

`./scripts/dev.sh` does the same from this folder: creates `.env` from `.env.example` if missing, installs dependencies if needed, then runs `pnpm dev`.

## Scripts

```bash
pnpm dev | dev:stagging | dev:uat | dev:production
pnpm build | build:stagging | build:uat | build:production   # vite build && tsc --noEmit
pnpm serve | serve:stagging | serve:uat | serve:production   # vite preview
npx tsc --noEmit                                             # typecheck only
```

Mode builds load `.env.<mode>` from this folder (`stagging` keeps its original spelling).

## Authentication

Keycloak SSO (authorization code flow). `src/lib/keycloak.ts` starts the login, `src/routes/api/sso/callback.tsx` exchanges the code through `sa/auth/exchange-auth-code`, `AuthProvider` keeps tokens and the user (`sa/auth/me`, `sa/auth/permissions`). Required keys: `FIS_SSO_URL`, `FIS_REALM`, `FIS_CLIENT_ID`, `FIS_REDIRECT_URL`.

## API access

Always use `request` from `src/lib/axios.ts` (base URL `FIS_API_BASE_URL`, auth + refresh interceptors). Type responses with `ApiResponse<T>` / `PaginatedResponse<T>` from `src/types/api.types.ts`.

## Real-time (optional)

`src/hooks/useSocket.ts` wraps Socket.io. Enabled with `FIS_ENABLE_SOCKET=true`; configure `FIS_SOCKET_URL` and `FIS_SOCKET_PATH`.

## Internationalization

`src/i18n/config.ts` (react-i18next, default language `vi`, fallback detection from localStorage/`?lang=`). One locale folder per domain under `src/i18n/locales/`, registered in `src/i18n/locales/index.ts`.

## Docker

`Dockerfile` builds the app and serves `dist/` with `nginx.conf`. The nginx `/api/` proxy target is a placeholder (`http://backend:8080/api/`); change it for your environment. The Dockerfile expects the build context to contain `package.json`, `pnpm-lock.yaml` and `pnpm-workspace.yaml`; build from a context that includes the workspace packages (`@workspace/ui`, `@workspace/lib`).

```bash
docker build -t web:latest .
docker run -p 8080:80 web:latest
```

## Kubernetes

Manifests in `k8s/` (ConfigMap, Deployment, Service, Ingress, HPA) use the neutral name `web` and example hosts/URLs. Replace the ConfigMap values, image and ingress host before deploying.

```bash
kubectl apply -f k8s/
./scripts/deploy.sh <environment>
```
