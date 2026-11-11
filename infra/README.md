# Local infrastructure

Docker Compose stack for local development: PostgreSQL, Redis, Consul, Keycloak, MinIO. Not for production (HTTP, dev-mode Keycloak and Consul, localhost-only ports).

| Service | Image | Host port | Notes |
| ------- | ----- | --------- | ----- |
| PostgreSQL | `postgres:17.9` | 5432 | `../db/*.sql` run on first start (empty volume only) |
| Redis | `redis:7.4.12-alpine` | 6379 | no password |
| Consul | `hashicorp/consul:1.22.7` | 8500 | `-dev`: KV is in memory, lost on container restart |
| Keycloak | `quay.io/keycloak/keycloak:26.8.2` | 8080 | `start-dev --import-realm`, realm `shop` |
| MinIO | `pgsty/minio:RELEASE.2026-08-04T00-00-00Z` | 9000 (API), 9001 (console) | bucket `shop` created by `minio-init` (`pgsty/mc`) |

All ports bind to `127.0.0.1`. Other ports from `docs/shop-contract.md` §9: backend 8200, admin web 8088, storefront 3000.

> MinIO no longer publishes official community images, so the default is the community fork `pgsty/minio` (and `pgsty/mc`). Override `MINIO_IMAGE` / `MC_IMAGE` in `infra/.env` to use another S3-compatible image.

## Prerequisites

Docker with Compose v2 (`docker compose`), `curl` (macOS/Linux scripts), JDK 21 (backend), Node >= 20 + pnpm (frontend). Maven is not required: use `be/mvnw` (Windows: `be\mvnw.cmd`), which downloads Maven 3.9.16 on first run.

## Start up

Run from the repository root. Windows uses PowerShell, macOS/Linux uses a POSIX shell.

1. **Create `infra/.env`** and fill every key (the file is git-ignored):

    ```powershell
    Copy-Item infra\.env.example infra\.env
    ```

    ```bash
    cp infra/.env.example infra/.env
    ```

    Generate the secrets you choose yourself (any random string works for `KEYCLOAK_CLIENT_SECRET`; `APP_CRYPTO_KEY` must be exactly 16, 24 or 32 characters; avoid `"` and `\` in every value):

    ```powershell
    -join (1..32 | ForEach-Object { '0123456789abcdef'[(Get-Random -Maximum 16)] })   # 32 characters
    ```

    ```bash
    openssl rand -hex 16    # 32 characters
    ```

2. **Start the stack** (the first start pulls images):

    ```bash
    cd infra
    docker compose up -d
    docker compose ps          # wait until postgres, redis, consul, keycloak show "healthy"
    docker compose logs minio-init   # should end with: bucket shop ready
    ```

    `../db/01-core-schema.sql`, `02-shop-schema.sql`, `03-seed.sql` are applied by PostgreSQL in name order on the first start. If one fails, fix it and run a reset (below): init scripts do not re-run on an existing volume.

3. **Load the backend configuration into Consul** (renders `consul/core-app-local.yml.example` with `infra/.env` into key `config/core-app,local/data`):

    ```powershell
    powershell -ExecutionPolicy Bypass -File infra\scripts\load-consul-config.ps1
    ```

    ```bash
    sh infra/scripts/load-consul-config.sh
    ```

    Re-run this after every `docker compose restart consul` / `down` (dev Consul keeps nothing on disk) and after editing `.env` or the template. Inspect the stored value (it contains secrets): `curl -s "http://localhost:8500/v1/kv/config/core-app,local/data?raw"`.

4. **Create the first admin** (Keycloak user in realm `shop` + `sa_user` row with role `SHOP_ADMIN_ROLE_CODE`; re-runnable, resets the password):

    ```powershell
    powershell -ExecutionPolicy Bypass -File infra\scripts\bootstrap-admin.ps1
    ```

    ```bash
    sh infra/scripts/bootstrap-admin.sh
    ```

5. **Run the backend and frontends** (backend reads Consul on startup, so steps 3 and 4 come first):

    ```bash
    cd be
    ./mvnw clean install -DskipTests          # Windows: mvnw.cmd clean install -DskipTests
    ./mvnw spring-boot:run -pl core-server -Dspring-boot.run.profiles=local
    ```

    Admin web `fe/apps/web/.env`: `FIS_SSO_URL=http://localhost:8080`, `FIS_REALM=shop`, `FIS_CLIENT_ID=shop-app`, `FIS_REDIRECT_URL=http://localhost:8088/api/sso/callback`, `FIS_API_BASE_URL=http://localhost:8200`. The storefront uses `http://localhost:3000/auth/callback` as redirect URL (already registered on the client).

Checks: Keycloak console `http://localhost:8080` (master realm admin = `KEYCLOAK_ADMIN_USER`), Consul UI `http://localhost:8500`, MinIO console `http://localhost:9001` (`MINIO_ROOT_USER`), backend `http://localhost:8200/actuator/health`.

## How the Keycloak client secret reaches the backend

`infra/.env` holds `KEYCLOAK_CLIENT_SECRET` (you choose it). Both consumers read that one value:

1. `docker-compose.yml` passes it to the Keycloak container as an env var; `keycloak/realm-shop.json` references it as the placeholder `${KEYCLOAK_CLIENT_SECRET}` (Keycloak realm-import env substitution), so the imported client `shop-app` gets exactly that secret. The secret is not stored in git.
2. `load-consul-config` writes it to Consul as `keycloak.credentials.secret`, which the backend binds to `KeycloakProperties`.

If you change the secret later: the realm import is skipped when the realm already exists, so either update it in Keycloak (Clients, `shop-app`, Credentials) or reset Keycloak (below), then re-run `load-consul-config`.

## Realm `shop`

- Confidential client `shop-app`: standard flow, direct access grants, service account with realm-management roles `manage-users`, `view-users`, `manage-realm`.
- Redirect URIs: `http://localhost:8088/api/sso/callback`, `http://localhost:3000/auth/callback`; web origins and post-logout URIs for `localhost:8088` and `localhost:3000`.
- Self-registration is off (buyers register through `/shop/public/auth/register`, which creates the Keycloak user via the service account). Login page defaults to Vietnamese with English available.
- No human users are imported. The only imported user is the client's service-account user.
- The realm has no password policy; the backend validates passwords against the realm policy, so add one in Keycloak if you want stricter rules.

## Reset

```bash
cd infra
docker compose down -v      # stops everything and DELETES all data: Postgres, Redis, Keycloak, MinIO
docker compose up -d
```

Then repeat steps 3 and 4. Partial resets: `docker volume rm shop-infra_postgres-data` (re-runs `db/*.sql`), `shop-infra_keycloak-data` (re-imports the realm), `shop-infra_minio-data`. Stop the stack first (`docker compose down`).

## Troubleshooting

- `required variable ... is missing`: a key in `infra/.env` is empty.
- Backend fails at startup with an issuer error: Keycloak is not ready yet or the realm was not imported (`docker compose logs keycloak`).
- Backend cannot find its config: Consul was restarted; re-run `load-consul-config`.
- `bootstrap-admin` says the role is missing: `db/03-seed.sql` did not run (see `docker compose logs postgres`) or `SHOP_ADMIN_ROLE_CODE` is wrong; check with `docker exec shop-postgres psql -U <user> -d <db> -c "select code,status from sa_role"`.
- Windows: if scripts are blocked, keep `-ExecutionPolicy Bypass` as shown.
