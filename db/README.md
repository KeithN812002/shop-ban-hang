# Database scripts

PostgreSQL scripts for the shop. The backend has no `ddl-auto` and no migration tool, so these files are the schema.
They were written from the JPA entities and have **not** been executed against a live PostgreSQL (none was available
when they were written) - run them on a throw-away database first.

## Order of execution

| # | File | Content |
| - | ---- | ------- |
| 1 | `01-core-schema.sql` | Core tables: `sa_user`, `sa_role`, `sa_permission`, `sa_role_permission`, `sa_unit`, `sa_department`, `sa_position`, `sa_gender`, `sa_email_*`; enum types `status_basic`, `permission_type`, `http_method`, `status_email_outbox`; sequence `sa_permission_seq` |
| 2 | `02-shop-schema.sql` | `shop_*` tables of `docs/shop-contract.md` section 4 with FKs and indexes (needs the `pg_trgm` extension) |
| 3 | `03-seed.sql` | Menu/permission tree (`SA` module and `SHOP-ADMIN` module), role `ADMIN` with every permission, category tree. No products, users or orders |
| 4 | `04-promotion-returning.sql` | `docs/shop-contract.md` section 11: widens the `shop_order.status` CHECK with `RETURNING`, tables `shop_promotion` / `shop_promotion_product`, admin permission row `confirmReturned` (module `SHOP-ADMIN`, menu Orders) granted to role `ADMIN` |
| 5 | `05-return-refund.sql` | `docs/shop-contract.md` section 12: widens the `shop_order.status` CHECK with `RETURN_REQUESTED`, `RETURN_APPROVED`, `RETURN_SHIPPING`, `RETURN_RECEIVED`, `REFUNDED`; columns `shop_order.return_shipper_username` / `refunded_at`; table `shop_return_request`; admin permission rows `resolveReturn` and `markRefunded` (module `SHOP-ADMIN`, menu Orders) granted to role `ADMIN` |
| 6 | admin bootstrap | created by infra from the section below (needs the Keycloak user id) |

```bash
psql -v ON_ERROR_STOP=1 -d <db> -f 01-core-schema.sql -f 02-shop-schema.sql -f 03-seed.sql -f 04-promotion-returning.sql -f 05-return-refund.sql
```

On an existing database run only the new files (`psql -v ON_ERROR_STOP=1 -d <db> -f 05-return-refund.sql`, and `04-promotion-returning.sql` first if it was never applied), then clear
the Redis key `user:<username>:permissions` of admin users (or let them sign in again) so the new permission is picked up.

All scripts are idempotent. `03-seed.sql` defines session-local helper functions in `pg_temp`, so run it as one
`psql -f` session.

Requirements: PostgreSQL 13+ (`gen_random_uuid()` is built in), `pg_trgm` available (contrib; superuser or a trusted extension).

## Admin user bootstrap (for the infra script)

The admin signs in to the admin web through Keycloak. The backend then reads the user from `sa_user` and resolves the
permissions from the **role codes stored in the `sa_user.roles` text array** (there is no user-role join table).

Fixed values:

| Item | Value |
| ---- | ----- |
| Admin role code (`sa_role.code`) | `ADMIN` (seeded by `03-seed.sql`, status `ACTIVE`, granted every `sa_permission` row) |
| `app_code` of every SA row (`sa_user`, `sa_role`, `sa_permission`, `sa_role_permission`) | `CORE` (`AppEnum.CORE_APP`) |
| Menu modules | `SA` (`/sa`) and `SHOP-ADMIN` (`/shop-admin`) |

Row to create in `sa_user` for a Keycloak user whose username is `X` (lower-case, matches `^[a-z0-9]+([._-][a-z0-9]+)*$`,
max 50 characters; the backend compares it with the token claim `preferred_username`):

| Column | Value |
| ------ | ----- |
| `id` | omit (defaults to `gen_random_uuid()`) |
| `ext_id` | the Keycloak user id (UUID) of `X` |
| `user_name` | `X` |
| `personal_name` | display name (not null, max 200) |
| `email` | the email (max 100) |
| `is_internal` | `true` (an internal/staff account; `false` would make it an external, self-service user) |
| `app_code` | `CORE` |
| `roles` | `ARRAY['ADMIN']::text[]` |
| `status` | `'ACTIVE'` (enum `status_basic`) |
| `is_deleted` | `false` |
| `created_by`, `updated_by` | e.g. `'bootstrap'` (not null, max 50; `created_date`/`updated_date` default to `now()`) |
| all other columns | `NULL` (`gender_id`, `unit_id`, `position_id`, `department_id`, `external_unit_code`, `deleted_*`) |

```sql
INSERT INTO sa_user (ext_id, user_name, personal_name, email, is_internal, app_code, roles, status, is_deleted,
                     created_by, updated_by)
VALUES ('<keycloak-user-uuid>', 'X', 'Administrator', 'admin@example.com', true, 'CORE', ARRAY['ADMIN']::text[],
        'ACTIVE', false, 'bootstrap', 'bootstrap')
ON CONFLICT (user_name) DO UPDATE SET roles = ARRAY['ADMIN']::text[], status = 'ACTIVE', is_deleted = false;
```

Notes:

- The user must exist and be enabled in Keycloak (the realm of `keycloak.realm`); `sa_user` only holds the application data.
- No `sa_user_role` (or similar) table exists. Granting more roles means adding role codes to the `roles` array.
- The permission cache (`user:<username>:permissions` in Redis) is filled at login; after changing roles/permissions in
  SQL, delete the key or let the user sign in again.
- Registered shop users (`/shop/public/auth/register`) are external users: `is_internal = false`, `app_code = CORE`,
  `roles = '{}'`. They need no role: `/shop/me/**`, `/shop/seller/**` and `/shop/shipper/**` skip the permission check.
