# ELV Project Acceptance System - Staging Deployment Report

## Result

- Status: **Staging deployment successful**
- Deployment date: 2026-06-23 (Asia/Shanghai)
- Server: `192.168.120.11` / `TRACERES1`
- Source branch: `main`
- Source commit initially deployed: `41977f2` (`Build offline sync core engine`)
- Staging HTTP: `http://192.168.120.11:8088/`
- Staging HTTPS: `https://192.168.120.11:8443/`
- Existing BMS PM WEB remained available on ports `80`, `443`, and backend port `3002`.

Production was not cut over. The staging service is isolated so ELV and BMS PM WEB can continue to run in parallel.

## Server Environment

| Component | Value |
| --- | --- |
| OS | Microsoft Windows Server 2019 Standard, 64-bit |
| OS version | 10.0.17763 |
| Web server | Microsoft IIS 10 |
| Reverse proxy | IIS URL Rewrite + ARR proxy |
| Node.js | 24.16.0, dedicated ELV copy |
| npm | 11.13.0 |
| PostgreSQL | 16.14, portable Windows x64 distribution |
| PostgreSQL service | `ELV_PostgreSQL_16_Staging`, Automatic, running as LocalSystem |
| Redis | Not installed; PostgreSQL-backed sessions are used |
| Existing SQL Server | Port 1433, unchanged |
| Disk | C: 894.03 GB total, approximately 703.6 GB free after deployment |

The server has no working external DNS/internet access. Dependencies and PostgreSQL binaries were prepared on the deployment workstation and transferred as checksum-verified offline packages.

## Deployment Layout

| Purpose | Path |
| --- | --- |
| Deployment root | `C:\ELV_Project_Acceptance` |
| Application | `C:\ELV_Project_Acceptance\app` |
| Node runtime | `C:\ELV_Project_Acceptance\runtime\node` |
| PostgreSQL runtime | `C:\ELV_Project_Acceptance\runtime\postgresql\pgsql` |
| PostgreSQL data | `C:\ELV_Project_Acceptance\data\postgres` |
| Upload storage | `C:\ELV_Project_Acceptance\data\uploads` |
| Application upload junction | `C:\ELV_Project_Acceptance\app\data\uploads` |
| Logs | `C:\ELV_Project_Acceptance\logs` |
| Backups | `C:\ELV_Project_Acceptance\backups` |
| Restricted credentials | `C:\ELV_Project_Acceptance\secrets\staging-credentials.json` |

The credentials file and `.env` have inheritance disabled and are restricted to Administrators and SYSTEM. No secret values are committed to Git.

## Ports and Isolation

| Port | Service | Exposure |
| --- | --- | --- |
| 80 / 443 | Existing BMS PM WEB | Unchanged |
| 3002 | Existing BMS Node backend | Unchanged |
| 4177 | ELV Node API | Direct LAN access blocked by Windows Firewall |
| 5433 | ELV PostgreSQL | Bound to `127.0.0.1` only |
| 8088 | ELV staging HTTP | Local subnet |
| 8443 | ELV staging HTTPS | Local subnet |

Firewall rules:

- `ELV Staging HTTP 8088`: allow LocalSubnet
- `ELV Staging HTTPS 8443`: allow LocalSubnet
- `ELV Staging API Direct Block 4177`: block LocalSubnet

## Runtime and Restart

- API task: `ELV_Acceptance_Staging_API`
- Principal: SYSTEM
- Trigger: server startup
- Restart policy: up to 999 restarts at one-minute intervals
- Runner: `deploy/windows/run-staging.cmd`
- API logs:
  - `C:\ELV_Project_Acceptance\logs\api.log`
  - `C:\ELV_Project_Acceptance\logs\api-error.log`

PostgreSQL is registered as an automatic Windows service with service-recovery restart actions.

## IIS Configuration

- Site: `ELV Acceptance Staging`
- App pool: `ELVAcceptanceStagingPool`
- Physical path: `C:\ELV_Project_Acceptance\app\dist`
- Bindings: `*:8088` HTTP and `*:8443` HTTPS
- `/api/*` is reverse-proxied to `http://127.0.0.1:4177/api/*`.
- `/uploads/*` is explicitly blocked.
- Files are only available through authenticated `/api/files/:fileName`.
- Request size limit is 100 MB to match the API upload limit.

Configuration source: `deploy/windows/staging-web.config`.

## Environment Keys

The staging `.env` contains these keys:

```text
NODE_ENV
API_PORT
API_JSON_LIMIT
API_RATE_LIMIT
LOGIN_RATE_LIMIT
LOGIN_LOCK_THRESHOLD
LOGIN_LOCK_DURATION_MINUTES
UPLOAD_RATE_LIMIT
UPLOAD_PROJECT_QUOTA_MB
UPLOAD_ORPHAN_GRACE_HOURS
BCRYPT_ROUNDS
CORS_ORIGINS
DATA_STORE
ACCESS_LOG
ALLOW_DEMO_USERS
SESSION_COOKIE_NAME
SESSION_COOKIE_SAMESITE
SESSION_COOKIE_SECURE
SESSION_SECRET
DATABASE_URL
UPLOAD_DIR
BACKUP_DIR
```

Important values:

- `DATA_STORE=postgres`
- CORS is limited to the staging HTTP and HTTPS origins.
- Demo/default passwords were replaced with strong random passwords.
- Browser demo credentials are not included in the production frontend bundle.
- Sessions are random tokens stored in PostgreSQL.
- `SESSION_SECRET` is generated and stored, although the current session implementation does not yet consume this key.

## Database Initialization

Completed successfully:

```text
prisma generate
prisma migrate deploy
JSON seed import
```

Final clean data counts:

- Projects: 2
- Equipment: 9
- Points: 21
- Inspection records: 19
- Users: 4
- Upload files: 0

The initial migration contained a UTF-8 BOM that caused PostgreSQL error `42601`; the BOM was removed before deployment.

## Validation Results

| Check | Result |
| --- | --- |
| `npm run build` | Passed |
| `npm audit --audit-level=low` | Passed, 0 vulnerabilities |
| Prisma generate | Passed |
| Prisma migrate deploy | Passed |
| JSON to PostgreSQL import | Passed |
| `npm run smoke:postgres` | Passed |
| `npm run smoke:permissions` | Passed |
| `/api/ready` through HTTP | 200, PostgreSQL and storage ready |
| `/api/ready` through HTTPS | 200 |
| Login with hardened admin password | Passed |
| Dashboard | Passed in browser |
| Data Table and location tree | Passed in browser |
| Media page | Passed in browser |
| Multipart media upload through IIS | Passed |
| Unauthenticated media download | Rejected with 401 |
| Authenticated media download | Passed with 200 and matching content |
| Mobile offline queue | Passed; showed `Offline: 2 Pending` |
| Mobile reconnect sync | Passed; returned to `Online / Synced` |
| Direct LAN access to port 4177 | Blocked |
| Existing BMS HTTP/HTTPS | 200, unchanged |
| Existing BMS backend port 3002 | Listening, unchanged |

### Load Test

Server-side test through IIS:

- Concurrency: 100
- Duration: 15 seconds
- Shared authenticated manager session
- Requests: 4,932
- Errors: 0
- p50: 308 ms
- p95: 408 ms
- p99: 565 ms
- Covered: login, bootstrap/dashboard data, sync, import preview, upload

A separate 100-simultaneous-login preflight on the deployment workstation produced approximately 18.5-second login p95 because bcrypt verification is CPU intensive. The 100-user operational workload passed, but a login storm remains a capacity risk.

## Backup

- Scheduled task: `ELV_Acceptance_Staging_Backup`
- Schedule: daily at 02:30 server local time
- Restart on failure: 3 attempts, five-minute interval
- Initial backup: successful
- Initial artifacts:
  - `postgres.dump`
  - `uploads.tar.gz`
  - `manifest.json`
- Backup error log after final validation: 0 bytes

Runner: `deploy/windows/run-backup.cmd`.

Backups currently remain on the same server. They must be copied to encrypted off-host storage for production.

## Code and Deployment Fixes

- Removed UTF-8 BOM from the initial Prisma migration.
- Fixed the permissions smoke test so GET/HEAD requests do not send a request body.
- Corrected the load-test deadline and added a shared-session mode for real concurrent application traffic.
- Hid demo login controls in production and removed default passwords from the production JavaScript bundle.
- Added Windows staging install, runtime, IIS, backup, hardening, and inventory scripts.
- Removed the Prisma-only `schema` query parameter before calling `pg_dump` and `pg_restore`.
- Removed `shell: true` from backup/restore child processes.

## Remaining Risks Before Production

1. **Trusted HTTPS certificate required.** Port 8443 currently uses the existing self-signed `WMSvc-SHA2-TRACERES1` certificate. It is not a production browser-trusted certificate and does not provide a proper public/internal DNS identity.
2. **Secure cookie cutover required.** Staging keeps `SESSION_COOKIE_SECURE=false` so HTTP 8088 can be tested. Production must use HTTPS only and set it to `true`.
3. **PostgreSQL service account.** Staging PostgreSQL runs as LocalSystem. Production should use a dedicated least-privilege Windows service account.
4. **API bind address.** The Node process listens on all local interfaces, while firewall rules block direct LAN access. A future code change should support binding explicitly to `127.0.0.1`.
5. **Off-host backups and retention.** Daily backup works, but there is no off-host copy, retention pruning, or completed restore drill yet.
6. **Virus scanning.** Upload MIME/extension checks exist, but antivirus/quarantine integration is still absent.
7. **Login storm capacity.** 100 simultaneous bcrypt logins are slow; production should use ramp-up testing and consider native bcrypt/worker isolation or SSO.
8. **Log rotation.** Logs are written to disk but automated size/retention rotation is not yet configured.
9. **Session secret integration.** The secret is generated, but current PostgreSQL session tokens are not signed or hashed with it.

## Production Cutover Recommendation

Do not replace BMS PM WEB or reuse its ports. For production:

1. Allocate a DNS name such as `elv-acceptance.<internal-domain>`.
2. Install a trusted certificate for that DNS name.
3. Add an SNI HTTPS binding on port 443 for the ELV hostname, leaving the BMS binding intact.
4. Set `SESSION_COOKIE_SECURE=true` and remove/disable staging HTTP 8088.
5. Move PostgreSQL to a dedicated service account or managed database.
6. Configure off-host backup replication and perform a restore drill.
7. Run a longer ramped 100-user test and a controlled authentication-load test.

## Operational Commands

```powershell
# API status
Get-ScheduledTask -TaskName ELV_Acceptance_Staging_API
Invoke-RestMethod http://127.0.0.1:4177/api/ready

# Restart API
Stop-ScheduledTask -TaskName ELV_Acceptance_Staging_API
Start-ScheduledTask -TaskName ELV_Acceptance_Staging_API

# PostgreSQL status
Get-Service ELV_PostgreSQL_16_Staging

# IIS status
Import-Module WebAdministration
Get-Website -Name "ELV Acceptance Staging"

# Run backup now
Start-ScheduledTask -TaskName ELV_Acceptance_Staging_Backup
```
