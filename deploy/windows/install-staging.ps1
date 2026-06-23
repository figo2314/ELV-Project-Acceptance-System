param(
  [string]$Root = "C:\ELV_Project_Acceptance"
)

$ErrorActionPreference = "Stop"

$app = Join-Path $Root "app"
$pgBin = Join-Path $Root "runtime\postgresql\pgsql\bin"
$pgData = Join-Path $Root "data\postgres"
$uploadTarget = Join-Path $Root "data\uploads"
$serviceName = "ELV_PostgreSQL_16_Staging"
$credentialPath = Join-Path $Root "secrets\staging-credentials.json"

function New-HexSecret([int]$Bytes = 32) {
  $buffer = New-Object byte[] $Bytes
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buffer)
  return -join ($buffer | ForEach-Object { $_.ToString("x2") })
}

foreach ($directory in @(
  $pgData,
  $uploadTarget,
  (Join-Path $uploadTarget ".tmp"),
  (Join-Path $Root "logs"),
  (Join-Path $Root "backups"),
  (Join-Path $Root "secrets")
)) {
  New-Item -ItemType Directory -Path $directory -Force | Out-Null
}

$currentIdentity = [Security.Principal.WindowsIdentity]::GetCurrent().Name
& icacls $pgData `
  /inheritance:r `
  /grant:r "${currentIdentity}:(OI)(CI)F" "SYSTEM:(OI)(CI)F" | Out-Null

if (Test-Path $credentialPath) {
  $credentials = Get-Content $credentialPath -Raw | ConvertFrom-Json
  $pgAdminPassword = $credentials.database.adminPassword
  $dbPassword = $credentials.database.appPassword
  $appPasswords = @{
    admin = $credentials.applicationUsers.admin.password
    manager = $credentials.applicationUsers.manager.password
    engineer = $credentials.applicationUsers.engineer.password
    field = $credentials.applicationUsers.field.password
  }
} else {
  $pgAdminPassword = New-HexSecret 24
  $dbPassword = New-HexSecret 24
  $appPasswords = @{
    admin = New-HexSecret 18
    manager = New-HexSecret 18
    engineer = New-HexSecret 18
    field = New-HexSecret 18
  }
}
$sessionSecret = New-HexSecret 48

if (!(Test-Path (Join-Path $pgData "PG_VERSION"))) {
  $passwordFile = Join-Path $Root "secrets\.pg-init-password"
  Set-Content -LiteralPath $passwordFile -Value $pgAdminPassword -Encoding ascii -NoNewline
  & (Join-Path $pgBin "initdb.exe") `
    -D $pgData `
    -U elv_pg_admin `
    "--pwfile=$passwordFile" `
    "--auth-host=scram-sha-256" `
    "--auth-local=scram-sha-256" `
    "--encoding=UTF8" `
    "--no-locale"
  if ($LASTEXITCODE -ne 0) {
    throw "initdb failed with exit code $LASTEXITCODE"
  }
  Remove-Item -LiteralPath $passwordFile -Force

  $logDirectory = (Join-Path $Root "logs").Replace("\", "/")
  Add-Content -LiteralPath (Join-Path $pgData "postgresql.conf") -Encoding ascii -Value @"

listen_addresses = '127.0.0.1'
port = 5433
password_encryption = 'scram-sha-256'
max_connections = 200
shared_buffers = '256MB'
log_min_duration_statement = 1000
logging_collector = on
log_directory = '$logDirectory'
log_filename = 'postgresql-%Y-%m-%d.log'
"@
}

if (!(Get-Service -Name $serviceName -ErrorAction SilentlyContinue)) {
  & (Join-Path $pgBin "pg_ctl.exe") register -N $serviceName -D $pgData -S auto
  if ($LASTEXITCODE -ne 0) {
    throw "PostgreSQL service registration failed with exit code $LASTEXITCODE"
  }
}
Set-Service -Name $serviceName -StartupType Automatic
& sc.exe failure $serviceName reset= 86400 actions= restart/5000/restart/15000/restart/60000 | Out-Null
& sc.exe failureflag $serviceName 1 | Out-Null
Start-Service -Name $serviceName

$ready = $false
for ($attempt = 0; $attempt -lt 30; $attempt += 1) {
  Start-Sleep -Seconds 1
  & (Join-Path $pgBin "pg_isready.exe") -h 127.0.0.1 -p 5433 -U elv_pg_admin | Out-Null
  if ($LASTEXITCODE -eq 0) {
    $ready = $true
    break
  }
}
if (!$ready) {
  throw "PostgreSQL did not become ready."
}

$env:PGPASSWORD = $pgAdminPassword
try {
  $roleExists = & (Join-Path $pgBin "psql.exe") `
    -h 127.0.0.1 -p 5433 -U elv_pg_admin -d postgres `
    -Atc "select 1 from pg_roles where rolname='elv_acceptance'"
  if ($roleExists -ne "1") {
    & (Join-Path $pgBin "psql.exe") `
      -h 127.0.0.1 -p 5433 -U elv_pg_admin -d postgres `
      -v ON_ERROR_STOP=1 `
      -c "CREATE ROLE elv_acceptance LOGIN PASSWORD '$dbPassword';"
    if ($LASTEXITCODE -ne 0) {
      throw "Application database role creation failed."
    }
  }

  $databaseExists = & (Join-Path $pgBin "psql.exe") `
    -h 127.0.0.1 -p 5433 -U elv_pg_admin -d postgres `
    -Atc "select 1 from pg_database where datname='elv_acceptance'"
  if ($databaseExists -ne "1") {
    & (Join-Path $pgBin "createdb.exe") `
      -h 127.0.0.1 -p 5433 -U elv_pg_admin `
      -O elv_acceptance elv_acceptance
    if ($LASTEXITCODE -ne 0) {
      throw "Application database creation failed."
    }
  }
} finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

$environment = @(
  "NODE_ENV=production",
  "API_PORT=4177",
  "API_JSON_LIMIT=25mb",
  "API_RATE_LIMIT=60000",
  "LOGIN_RATE_LIMIT=300",
  "LOGIN_LOCK_THRESHOLD=5",
  "LOGIN_LOCK_DURATION_MINUTES=15",
  "UPLOAD_RATE_LIMIT=6000",
  "UPLOAD_PROJECT_QUOTA_MB=1024",
  "UPLOAD_ORPHAN_GRACE_HOURS=24",
  "BCRYPT_ROUNDS=12",
  "CORS_ORIGINS=http://192.168.120.11:8088,https://192.168.120.11:8443",
  "DATA_STORE=postgres",
  "ACCESS_LOG=true",
  "ALLOW_DEMO_USERS=false",
  "SESSION_COOKIE_NAME=elv_staging_session",
  "SESSION_COOKIE_SAMESITE=Lax",
  "SESSION_COOKIE_SECURE=false",
  "SESSION_SECRET=$sessionSecret",
  "DATABASE_URL=postgresql://elv_acceptance:$dbPassword@127.0.0.1:5433/elv_acceptance?schema=public",
  "UPLOAD_DIR=$($uploadTarget.Replace('\', '/'))",
  "BACKUP_DIR=$((Join-Path $Root 'backups').Replace('\', '/'))"
)
$envPath = Join-Path $app ".env"
Set-Content -LiteralPath $envPath -Value $environment -Encoding ascii

$credentialDocument = [ordered]@{
  createdAt = (Get-Date).ToString("o")
  applicationUsers = [ordered]@{
    admin = [ordered]@{ username = "admin"; password = $appPasswords.admin }
    manager = [ordered]@{ username = "manager"; password = $appPasswords.manager }
    engineer = [ordered]@{ username = "engineer"; password = $appPasswords.engineer }
    field = [ordered]@{ username = "field"; password = $appPasswords.field }
  }
  database = [ordered]@{
    adminUsername = "elv_pg_admin"
    adminPassword = $pgAdminPassword
    appUsername = "elv_acceptance"
    appPassword = $dbPassword
    host = "127.0.0.1"
    port = 5433
    database = "elv_acceptance"
  }
}
$credentialDocument | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $credentialPath -Encoding utf8

& icacls $envPath /inheritance:r /grant:r "SYSTEM:F" "Administrators:F" | Out-Null
& icacls (Join-Path $Root "secrets") `
  /inheritance:r `
  /grant:r "SYSTEM:(OI)(CI)F" "Administrators:(OI)(CI)F" | Out-Null

$uploadLink = Join-Path $app "data\uploads"
if (Test-Path $uploadLink) {
  $existingUploadPath = Get-Item $uploadLink -Force
  if (!$existingUploadPath.Attributes.ToString().Contains("ReparsePoint")) {
    throw "Unexpected existing upload path: $uploadLink"
  }
} else {
  New-Item -ItemType Junction -Path $uploadLink -Target $uploadTarget | Out-Null
}

[pscustomobject]@{
  Service = (Get-Service $serviceName).Status
  PostgreSqlReady = $ready
  PostgreSqlAddress = (Get-NetTCPConnection -State Listen -LocalPort 5433).LocalAddress
  Database = "elv_acceptance"
  EnvPath = $envPath
  CredentialsPath = $credentialPath
  UploadTarget = $uploadTarget
  UploadLink = (Get-Item $uploadLink).Target
} | ConvertTo-Json -Compress
