# Render infra/consul/core-app-local.yml.example with values from infra/.env and
# store it in Consul KV at config/core-app,local/data.
# Usage: powershell -ExecutionPolicy Bypass -File infra\scripts\load-consul-config.ps1
#        ($env:CONSUL_HTTP_ADDR overrides http://127.0.0.1:8500)
$ErrorActionPreference = 'Stop'

$scriptDir = $PSScriptRoot
$infraDir = Split-Path -Parent $scriptDir
. (Join-Path $scriptDir '_env.ps1')

$envValues = Read-EnvFile (Join-Path $infraDir '.env')
Assert-Env $envValues @('POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'KEYCLOAK_CLIENT_SECRET',
    'MINIO_ROOT_USER', 'MINIO_ROOT_PASSWORD', 'APP_CRYPTO_KEY')
# Optional key: empty means "rule-based chatbot fallback only", but it must be defined for the template.
if (-not $envValues.ContainsKey('ANTHROPIC_API_KEY')) { $envValues['ANTHROPIC_API_KEY'] = '' }

$cryptoLen = $envValues['APP_CRYPTO_KEY'].Length
if ($cryptoLen -notin 16, 24, 32) { Fail "APP_CRYPTO_KEY must be exactly 16, 24 or 32 characters (got $cryptoLen)" }

$consulAddr = if ($env:CONSUL_HTTP_ADDR) { $env:CONSUL_HTTP_ADDR } else { 'http://127.0.0.1:8500' }
$templatePath = Join-Path $infraDir 'consul\core-app-local.yml.example'
if (-not (Test-Path -LiteralPath $templatePath)) { Fail "template not found: $templatePath" }

$template = [System.IO.File]::ReadAllText($templatePath, [System.Text.Encoding]::UTF8)
$problems = [System.Collections.Generic.List[string]]::new()
$rendered = [regex]::Replace($template, '\$\{([A-Za-z_][A-Za-z0-9_]*)\}', {
        param($m)
        $name = $m.Groups[1].Value
        if (-not $envValues.ContainsKey($name)) {
            $problems.Add("template references $name but it is not defined in infra/.env")
            return ''
        }
        $value = $envValues[$name]
        if ($value -match '["\\]') {
            $problems.Add("$name contains a double quote or backslash, which is not allowed")
            return ''
        }
        return $value
    })
if ($problems.Count -gt 0) { Fail ($problems -join "`n") }

# Normalise to LF without BOM before upload.
$body = [System.Text.UTF8Encoding]::new($false).GetBytes($rendered.Replace("`r`n", "`n"))
$uri = "$consulAddr/v1/kv/config/core-app,local/data"
try {
    $result = Invoke-RestMethod -Method Put -Uri $uri -Body $body -ContentType 'text/plain; charset=utf-8'
}
catch {
    Fail "could not write to Consul at $consulAddr (is the consul container healthy?): $($_.Exception.Message)"
}
if ("$result".Trim().ToLowerInvariant() -ne 'true') { Fail "Consul rejected the write (response: $result)" }

Write-Host "Loaded config/core-app,local/data into Consul at $consulAddr"
Write-Host "Review (contains secrets): curl.exe -s `"$consulAddr/v1/kv/config/core-app,local/data?raw`""
