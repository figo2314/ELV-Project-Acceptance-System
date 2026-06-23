param(
  [string]$Root = "C:\ELV_Project_Acceptance"
)

$ErrorActionPreference = "SilentlyContinue"
Import-Module WebAdministration

$os = Get-CimInstance Win32_OperatingSystem
$pgService = Get-CimInstance Win32_Service -Filter "Name='ELV_PostgreSQL_16_Staging'"
$apiTask = Get-ScheduledTask -TaskName "ELV_Acceptance_Staging_API"
$apiInfo = Get-ScheduledTaskInfo -TaskName "ELV_Acceptance_Staging_API"
$backupTask = Get-ScheduledTask -TaskName "ELV_Acceptance_Staging_Backup"
$backupInfo = Get-ScheduledTaskInfo -TaskName "ELV_Acceptance_Staging_Backup"
$site = Get-Website -Name "ELV Acceptance Staging"
$latestBackup = Get-ChildItem (Join-Path $Root "backups") -Directory |
  Sort-Object Name -Descending |
  Select-Object -First 1
$envKeys = @(
  Get-Content (Join-Path $Root "app\.env") |
    Where-Object { $_ -match "=" } |
    ForEach-Object { ($_ -split "=", 2)[0] }
)
$firewall = @(
  Get-NetFirewallRule |
    Where-Object { $_.DisplayName -like "ELV Staging*" } |
    ForEach-Object {
      $port = $_ | Get-NetFirewallPortFilter
      $address = $_ | Get-NetFirewallAddressFilter
      [pscustomobject]@{
        Name = $_.DisplayName
        Action = $_.Action
        Enabled = $_.Enabled
        Port = $port.LocalPort
        RemoteAddress = $address.RemoteAddress
      }
    }
)
$ready = Invoke-RestMethod "http://127.0.0.1:8088/api/ready"
$bms = Invoke-WebRequest "http://127.0.0.1/" -UseBasicParsing
$certificate = Get-ChildItem "Cert:\LocalMachine\My\8721346A8630E3BC3B4BC322A77003B908195FB4"

[pscustomobject]@{
  CapturedAt = (Get-Date).ToString("o")
  Host = $env:COMPUTERNAME
  OS = $os.Caption
  OSVersion = $os.Version
  Architecture = $os.OSArchitecture
  Node = (& (Join-Path $Root "runtime\node\node.exe") --version)
  Npm = (& (Join-Path $Root "runtime\node\npm.cmd") --version)
  PostgreSQL = (& (Join-Path $Root "runtime\postgresql\pgsql\bin\postgres.exe") --version)
  PostgreSQLService = [pscustomobject]@{
    State = $pgService.State
    StartMode = $pgService.StartMode
    StartName = $pgService.StartName
  }
  IISSite = [pscustomobject]@{
    Name = $site.Name
    State = [string]$site.State
    PhysicalPath = $site.PhysicalPath
    ApplicationPool = $site.ApplicationPool
    Bindings = @(Get-WebBinding -Name $site.Name | Select-Object protocol, bindingInformation, sslFlags)
  }
  Certificate = [pscustomobject]@{
    Subject = $certificate.Subject
    Issuer = $certificate.Issuer
    NotAfter = $certificate.NotAfter
    Thumbprint = $certificate.Thumbprint
  }
  ApiTask = [pscustomobject]@{
    State = [string]$apiTask.State
    LastResult = $apiInfo.LastTaskResult
    LastRun = $apiInfo.LastRunTime
  }
  BackupTask = [pscustomobject]@{
    State = [string]$backupTask.State
    LastResult = $backupInfo.LastTaskResult
    LastRun = $backupInfo.LastRunTime
    NextRun = $backupInfo.NextRunTime
  }
  Ready = $ready
  EnvKeys = $envKeys
  Firewall = $firewall
  Listeners = @(
    Get-NetTCPConnection -State Listen |
      Where-Object { $_.LocalPort -in @(80, 443, 1433, 3002, 4177, 5433, 8088, 8443) } |
      Select-Object LocalAddress, LocalPort, OwningProcess
  )
  Disk = @(
    Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" |
      Select-Object DeviceID,
        @{ Name = "SizeGB"; Expression = { [math]::Round($_.Size / 1GB, 2) } },
        @{ Name = "FreeGB"; Expression = { [math]::Round($_.FreeSpace / 1GB, 2) } }
  )
  Uploads = [pscustomobject]@{
    Target = Join-Path $Root "data\uploads"
    FileCount = @(Get-ChildItem (Join-Path $Root "data\uploads") -Recurse -File).Count
    Junction = (Get-Item (Join-Path $Root "app\data\uploads")).Target
  }
  LatestBackup = [pscustomobject]@{
    Path = $latestBackup.FullName
    Files = @(Get-ChildItem $latestBackup.FullName | Select-Object Name, Length)
  }
  Logs = @(Get-ChildItem (Join-Path $Root "logs") -File | Select-Object Name, Length, LastWriteTime)
  Bms = [pscustomobject]@{
    HttpStatus = $bms.StatusCode
    Title = ([regex]::Match($bms.Content, "<title>(.*?)</title>")).Groups[1].Value
    Node3002 = !!(Get-NetTCPConnection -State Listen -LocalPort 3002)
  }
} | ConvertTo-Json -Depth 9
