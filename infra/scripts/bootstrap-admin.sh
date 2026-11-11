#!/bin/sh
# Create (or repair) the first admin: Keycloak user in realm `shop` + matching sa_user row in PostgreSQL.
# Idempotent: re-running resets the password, re-enables the user and re-adds the role.
# Needs the compose stack running (containers shop-keycloak, shop-postgres) and db/03-seed.sql applied
# (the role named by SHOP_ADMIN_ROLE_CODE must exist in sa_role).
# Usage: sh infra/scripts/bootstrap-admin.sh
set -eu

# Stop Git Bash (MSYS) from rewriting /opt/... arguments into Windows paths.
export MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*'

script_dir=$(cd "$(dirname "$0")" && pwd)
infra_dir=$(dirname "$script_dir")
. "$script_dir/_env.sh"

load_env "$infra_dir/.env"
require_env KEYCLOAK_ADMIN_USER KEYCLOAK_ADMIN_PASSWORD POSTGRES_DB POSTGRES_USER \
  SHOP_ADMIN_USERNAME SHOP_ADMIN_PASSWORD SHOP_ADMIN_EMAIL SHOP_ADMIN_FULL_NAME SHOP_ADMIN_ROLE_CODE

KC_CONTAINER=shop-keycloak
PG_CONTAINER=shop-postgres
REALM=shop
KCADM=/opt/keycloak/bin/kcadm.sh

# --- validate input (same username rule as the backend: lower-case, digits, . _ -) ---
printf '%s' "$SHOP_ADMIN_USERNAME" | grep -Eq '^[a-z0-9]+([._-][a-z0-9]+)*$' ||
  die "SHOP_ADMIN_USERNAME must match ^[a-z0-9]+([._-][a-z0-9]+)*\$"
[ ${#SHOP_ADMIN_USERNAME} -le 50 ] || die "SHOP_ADMIN_USERNAME is longer than 50 characters (sa_user.user_name)"
printf '%s' "$SHOP_ADMIN_EMAIL" | grep -Eq '^[^@ "]+@[^@ "]+\.[^@ "]+$' || die "SHOP_ADMIN_EMAIL is not a valid email"
printf '%s' "$SHOP_ADMIN_ROLE_CODE" | grep -Eq '^[A-Za-z0-9_.-]+$' || die "SHOP_ADMIN_ROLE_CODE has unsupported characters"
case "$SHOP_ADMIN_FULL_NAME" in
  *\"* | *\\*) die "SHOP_ADMIN_FULL_NAME must not contain double quotes or backslashes" ;;
esac

require_container "$KC_CONTAINER"
require_container "$PG_CONTAINER"

psql_exec() { # reads SQL from stdin; extra args are psql -v assignments
  docker exec -i "$PG_CONTAINER" psql -X -q -tA -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"
}

# --- 0. the admin role must exist before touching Keycloak ---
role_count=$(printf '%s\n' "SELECT count(*) FROM sa_role WHERE code = :'role_code' AND status = 'ACTIVE';" |
  psql_exec -v "role_code=$SHOP_ADMIN_ROLE_CODE") || die "could not query sa_role (schema applied? see db/)"
[ "$role_count" = "1" ] ||
  die "role '$SHOP_ADMIN_ROLE_CODE' not found (or inactive) in sa_role. Apply db/03-seed.sql or fix SHOP_ADMIN_ROLE_CODE."

# --- 1. Keycloak: authenticate kcadm inside the container (password via env, not argv) ---
docker exec -e "KC_ADMIN_PASSWORD=$KEYCLOAK_ADMIN_PASSWORD" "$KC_CONTAINER" sh -c \
  "$KCADM config credentials --server http://localhost:8080 --realm master --user \"\$1\" --password \"\$KC_ADMIN_PASSWORD\"" \
  sh "$KEYCLOAK_ADMIN_USER" >/dev/null || die "Keycloak admin login failed (check KEYCLOAK_ADMIN_USER/PASSWORD and that Keycloak is ready)"

# --- 2. Keycloak: find or create the user ---
find_user_id() {
  docker exec "$KC_CONTAINER" "$KCADM" get users -r "$REALM" -q exact=true -q "username=$SHOP_ADMIN_USERNAME" \
    --fields id --format csv --noquotes | grep -Eo '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}' | head -n 1 || true
}
ext_id=$(find_user_id)

if [ -z "$ext_id" ]; then
  # Vietnamese names: given name is the last word.
  case "$SHOP_ADMIN_FULL_NAME" in
    *' '*) first_name=${SHOP_ADMIN_FULL_NAME##* }; last_name=${SHOP_ADMIN_FULL_NAME% *} ;;
    *) first_name=$SHOP_ADMIN_FULL_NAME; last_name=$SHOP_ADMIN_FULL_NAME ;;
  esac
  ext_id=$(docker exec "$KC_CONTAINER" "$KCADM" create users -r "$REALM" \
    -s "username=$SHOP_ADMIN_USERNAME" -s "email=$SHOP_ADMIN_EMAIL" \
    -s "firstName=$first_name" -s "lastName=$last_name" \
    -s enabled=true -s emailVerified=true -i) || die "failed to create Keycloak user"
  echo "Created Keycloak user $SHOP_ADMIN_USERNAME ($ext_id)"
else
  docker exec "$KC_CONTAINER" "$KCADM" update "users/$ext_id" -r "$REALM" -s enabled=true >/dev/null ||
    die "failed to enable existing Keycloak user"
  echo "Keycloak user $SHOP_ADMIN_USERNAME already exists ($ext_id); password will be reset"
fi

# --- 3. Keycloak: (re)set a permanent password (value passed via env, not argv) ---
docker exec -e "KC_USER_PASSWORD=$SHOP_ADMIN_PASSWORD" "$KC_CONTAINER" sh -c \
  "$KCADM set-password -r $REALM --username \"\$1\" --new-password \"\$KC_USER_PASSWORD\"" \
  sh "$SHOP_ADMIN_USERNAME" || die "failed to set Keycloak password (does it violate the realm password policy?)"

# --- 4. PostgreSQL: upsert sa_user (roles is a text[] of sa_role.code) ---
# Columns follow be/bom-sa entity User + EntityBase/EntitySoftDeleteBase. Insert uses VALUES so the
# literal 'ACTIVE' is coerced to the status enum column type.
psql_exec -v "ext_id=$ext_id" -v "username=$SHOP_ADMIN_USERNAME" -v "full_name=$SHOP_ADMIN_FULL_NAME" \
  -v "email=$SHOP_ADMIN_EMAIL" -v "role_code=$SHOP_ADMIN_ROLE_CODE" >/dev/null <<'SQL' || die "failed to upsert sa_user"
BEGIN;
UPDATE sa_user SET
  ext_id = :'ext_id'::uuid,
  personal_name = :'full_name',
  email = :'email',
  is_internal = true,
  app_code = 'CORE',
  status = 'ACTIVE',
  is_deleted = false,
  deleted_date = NULL,
  deleted_by = NULL,
  roles = (SELECT array_agg(DISTINCT r) FROM unnest(COALESCE(roles, '{}'::text[]) || ARRAY[:'role_code']::text[]) AS r),
  updated_date = now(),
  updated_by = 'bootstrap'
WHERE user_name = :'username';
SELECT count(*) = 0 AS need_insert FROM sa_user WHERE user_name = :'username' \gset
\if :need_insert
INSERT INTO sa_user (id, ext_id, user_name, personal_name, email, is_internal, app_code, roles, status,
                     is_deleted, created_date, created_by, updated_date, updated_by)
VALUES (gen_random_uuid(), :'ext_id'::uuid, :'username', :'full_name', :'email', true, 'CORE',
        ARRAY[:'role_code']::text[], 'ACTIVE', false, now(), 'bootstrap', now(), 'bootstrap');
\endif
COMMIT;
SQL

echo "Admin '$SHOP_ADMIN_USERNAME' ready: Keycloak realm '$REALM' + sa_user with role '$SHOP_ADMIN_ROLE_CODE'."
