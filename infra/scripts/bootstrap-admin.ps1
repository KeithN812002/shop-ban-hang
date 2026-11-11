# Create (or repair) the first admin: Keycloak user in realm `shop` + matching sa_user row in PostgreSQL.
# Idempotent: re-running resets the password, re-enables the user and re-adds the role.
# Needs the compose stack running (containers shop-keycloak, shop-postgres) and db/03-seed.sql applied
# (the role named by SHOP_ADMIN_ROLE_CODE must exist in sa_role).
# Usage: powershell -ExecutionPolicy Bypass -File infra\scripts\bootstrap-admin.ps1
$ErrorActionPreference = 'Stop'

$scriptDir = $PSScriptRoot
$infraDir = Split-Path -Parent $scriptDir
. (Join-Path $scriptDir '_env.ps1')

$cfg = Read-EnvFile (Join-Path $infraDir '.env')
Assert-Env $cfg @('KEYCLOAK_ADMIN_USER', 'KEYCLOAK_ADMIN_PASSWORD', 'POSTGRES_DB', 'POSTGRES_USER',
    'SHOP_ADMIN_USERNAME', 'SHOP_ADMIN_PASSWORD', 'SHOP_ADMIN_EMAIL', 'SHOP_ADMIN_FULL_NAME', 'SHOP_ADMIN_ROLE_CODE')

$kcContainer = 'shop-keycloak'
$pgContainer = 'shop-postgres'
$realm = 'shop'
$kcadm = '/opt/keycloak/bin/kcadm.sh'

$username = $cfg['SHOP_ADMIN_USERNAME']
$email = $cfg['SHOP_ADMIN_EMAIL']
$fullName = $cfg['SHOP_ADMIN_FULL_NAME']
$roleCode = $cfg['SHOP_ADMIN_ROLE_CODE']

# --- validate input (same username rule as the backend: lower-case, digits, . _ -) ---
if ($username -cnotmatch '^[a-z0-9]+([._-][a-z0-9]+)*$') { Fail 'SHOP_ADMIN_USERNAME must match ^[a-z0-9]+([._-][a-z0-9]+)*$' }
if ($username.Length -gt 50) { Fail 'SHOP_ADMIN_USERNAME is longer than 50 characters (sa_user.user_name)' }
if ($email -notmatch '^[^@ "]+@[^@ "]+\.[^@ "]+$') { Fail 'SHOP_ADMIN_EMAIL is not a valid email' }
if ($roleCode -notmatch '^[A-Za-z0-9_.-]+$') { Fail 'SHOP_ADMIN_ROLE_CODE has unsupported characters' }
if ($fullName -match '["\\]') { Fail 'SHOP_ADMIN_FULL_NAME must not contain double quotes or backslashes' }

Assert-Container $kcContainer
Assert-Container $pgContainer

# Docker/psql output and piped SQL must be UTF-8 (Vietnamese names).
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

# Run a native command; throw on non-zero exit. Returns stdout lines.
function Invoke-Native([string]$What, [scriptblock]$Command) {
    $out = & $Command
    if ($LASTEXITCODE -ne 0) { Fail "$What failed (exit $LASTEXITCODE)" }
    return $out
}

# psql inside the container; SQL comes from the pipeline, extra args are psql -v assignments.
function Invoke-Psql([string]$Sql, [string[]]$Vars) {
    $psqlArgs = @('exec', '-i', $pgContainer, 'psql', '-X', '-q', '-tA', '-v', 'ON_ERROR_STOP=1',
        '-U', $cfg['POSTGRES_USER'], '-d', $cfg['POSTGRES_DB'])
    foreach ($v in $Vars) { $psqlArgs += @('-v', $v) }
    $out = $Sql | & docker @psqlArgs
    if ($LASTEXITCODE -ne 0) { Fail "psql failed (exit $LASTEXITCODE)" }
    return $out
}

# --- 0. the admin role must exist before touching Keycloak ---
$roleCount = (Invoke-Psql "SELECT count(*) FROM sa_role WHERE code = :'role_code' AND status = 'ACTIVE';" @("role_code=$roleCode") | Select-Object -First 1)
if ("$roleCount".Trim() -ne '1') {
    Fail "role '$roleCode' not found (or inactive) in sa_role. Apply db/03-seed.sql or fix SHOP_ADMIN_ROLE_CODE."
}

# --- 1. Keycloak: authenticate kcadm inside the container (password via env, not argv) ---
# The inner script avoids double quotes (Windows PowerShell 5.1 mangles them in native arguments);
# `set -f` + empty IFS make unquoted expansions safe for any password.
$loginScript = "set -f; IFS=; $kcadm config credentials --server http://localhost:8080 --realm master --user `$1 --password `$KC_ADMIN_PASSWORD"
$null = Invoke-Native 'Keycloak admin login (check KEYCLOAK_ADMIN_USER/PASSWORD and that Keycloak is ready)' {
    docker exec -e "KC_ADMIN_PASSWORD=$($cfg['KEYCLOAK_ADMIN_PASSWORD'])" $kcContainer sh -c $loginScript sh $cfg['KEYCLOAK_ADMIN_USER']
}

# --- 2. Keycloak: find or create the user ---
$guid = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'
$found = & docker exec $kcContainer $kcadm get users -r $realm -q exact=true -q "username=$username" --fields id --format csv --noquotes 2>$null
$extId = ($found | Out-String | Select-String -Pattern $guid -AllMatches).Matches | Select-Object -First 1 -ExpandProperty Value

if (-not $extId) {
    # Vietnamese names: given name is the last word.
    $parts = $fullName.Trim() -split '\s+'
    $firstName = $parts[-1]
    $lastName = if ($parts.Count -gt 1) { ($parts[0..($parts.Count - 2)] -join ' ') } else { $firstName }
    $created = Invoke-Native 'create Keycloak user' {
        docker exec $kcContainer $kcadm create users -r $realm `
            -s "username=$username" -s "email=$email" -s "firstName=$firstName" -s "lastName=$lastName" `
            -s enabled=true -s emailVerified=true -i
    }
    $extId = ($created | Select-Object -Last 1).ToString().Trim()
    Write-Host "Created Keycloak user $username ($extId)"
}
else {
    $null = Invoke-Native 'enable existing Keycloak user' {
        docker exec $kcContainer $kcadm update "users/$extId" -r $realm -s enabled=true
    }
    Write-Host "Keycloak user $username already exists ($extId); password will be reset"
}
if ($extId -notmatch "^$guid$") { Fail "unexpected Keycloak user id: '$extId'" }

# --- 3. Keycloak: (re)set a permanent password (value passed via env, not argv) ---
$pwScript = "set -f; IFS=; $kcadm set-password -r $realm --username `$1 --new-password `$KC_USER_PASSWORD"
$null = Invoke-Native 'set Keycloak password (does it violate the realm password policy?)' {
    docker exec -e "KC_USER_PASSWORD=$($cfg['SHOP_ADMIN_PASSWORD'])" $kcContainer sh -c $pwScript sh $username
}

# --- 4. PostgreSQL: upsert sa_user (roles is a text[] of sa_role.code) ---
# Columns follow be/bom-sa entity User + EntityBase/EntitySoftDeleteBase. Insert uses VALUES so the
# literal 'ACTIVE' is coerced to the status enum column type.
$sql = @'
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
'@
$null = Invoke-Psql $sql @("ext_id=$extId", "username=$username", "full_name=$fullName", "email=$email", "role_code=$roleCode")

Write-Host "Admin '$username' ready: Keycloak realm '$realm' + sa_user with role '$roleCode'."
