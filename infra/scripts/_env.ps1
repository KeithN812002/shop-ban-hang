# Dot-sourced helper (do not run). Loads infra/.env without evaluating it as code.

function Fail([string]$Message) {
    [Console]::Error.WriteLine("ERROR: $Message")
    exit 1
}

# Read-EnvFile FILE -> hashtable of KEY=VALUE (blank lines and # comments skipped, matching quotes stripped).
function Read-EnvFile([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) {
        Fail "$Path not found. Copy infra/.env.example to infra/.env and fill every key."
    }
    $values = @{}
    foreach ($raw in Get-Content -LiteralPath $Path -Encoding UTF8) {
        $line = $raw.TrimEnd("`r")
        if ($line -eq '' -or $line.StartsWith('#')) { continue }
        $idx = $line.IndexOf('=')
        if ($idx -lt 1) { continue }
        $key = $line.Substring(0, $idx)
        if ($key -notmatch '^[A-Za-z0-9_]+$') { continue }
        $val = $line.Substring($idx + 1)
        if ($val.Length -ge 2 -and (($val.StartsWith('"') -and $val.EndsWith('"')) -or ($val.StartsWith("'") -and $val.EndsWith("'")))) {
            $val = $val.Substring(1, $val.Length - 2)
        }
        $values[$key] = $val
    }
    return $values
}

# Assert-Env ENV NAME... -> fail when a key is missing or empty.
function Assert-Env([hashtable]$Env, [string[]]$Names) {
    foreach ($name in $Names) {
        if (-not $Env.ContainsKey($name) -or [string]::IsNullOrEmpty($Env[$name])) {
            Fail "$name is empty or missing in infra/.env"
        }
    }
}

# Podman is a drop-in replacement: when only podman is installed, route every `docker` call to it.
if (-not (Get-Command docker -CommandType Application -ErrorAction SilentlyContinue) -and
    (Get-Command podman -CommandType Application -ErrorAction SilentlyContinue)) {
    function docker { $input | & podman @args }
}

function Assert-Container([string]$Name) {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { Fail 'docker (or podman) not found in PATH' }
    $running = (& docker inspect -f '{{.State.Running}}' $Name 2>$null)
    if ($LASTEXITCODE -ne 0 -or "$running".Trim() -ne 'true') {
        Fail "container $Name is not running. Start it with: docker compose up -d (in infra/)"
    }
}
