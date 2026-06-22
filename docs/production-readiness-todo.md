# Production Readiness TODO

This checklist tracks the hardening work needed before the ELV Project Acceptance System is used as a formal production service for 100+ concurrent users.

## P0 - Data Layer And Concurrency

- [x] Add PostgreSQL/Prisma schema, initial migration, local Docker database, and JSON import script.
- [x] Add data store runtime mode and readiness checks for PostgreSQL migration.
- [x] Add PostgreSQL auth/session/bootstrap read repositories.
- [x] Add PostgreSQL transactions for sync, equipment, row, and point writes.
- [x] Add PostgreSQL transactions for import, project/user admin, media uploads, and media records.
- [ ] Replace the JSON file database runtime with PostgreSQL repositories.
- [x] Add production PostgreSQL integration smoke tests.
- [ ] Switch production `DATA_STORE` to postgres after CI and deployment environment pass.
- [x] Add initial indexes for project, location, equipment, point, record status, assignee, due date, and audit log queries.
- [x] Add optimistic locking revision fields to equipment, points, and inspection records.
- [ ] Add a backup and restore procedure, including scheduled production backups.

## P0 - Authentication And Security

- [x] Add HTTP security headers with Helmet.
- [x] Add login and API rate limiting.
- [x] Replace new password hashes with bcrypt while keeping legacy SHA-256 login compatibility.
- [x] Replace wildcard CORS with an environment-based allowlist.
- [x] Remove demo/default passwords from production startup.
- [x] Add a forced first-password-change flow for seeded users.
- [x] Move sessions from process memory to Redis or database-backed sessions.
- [x] Add account lockout and admin unlock tools for repeated failed logins.
- [ ] Move browser auth storage from `localStorage` to a safer production token/session strategy.
- [ ] Add role and permission tests for every admin and field endpoint.

## P0 - Uploads And File Safety

- [ ] Replace memory-based uploads with streaming disk or object-storage uploads.
- [ ] Add authenticated file download routes instead of directly exposing `/uploads`.
- [ ] Add virus scanning or a quarantine workflow for uploaded files.
- [ ] Add per-project upload quotas and cleanup tools for orphaned files.
- [ ] Store file metadata in the production database while storing binary files on server/object storage.

## P1 - Excel Import

- [x] Replace the `xlsx` dependency because `npm audit` reported high-severity issues with no direct fix.
- [ ] Add server-side duplicate detection and import preview before committing rows.
- [ ] Add import job history with who imported, when, source file, row count, rejected rows, and rollback status.

## P1 - Offline Sync

- [ ] Add conflict-resolution UI for concurrent edits.
- [ ] Add record revision numbers and clear server-wins/client-wins/manual-merge rules.
- [ ] Add retry backoff and sync queue visibility for field users.
- [ ] Add audit entries for sync conflicts and conflict resolutions.

## P1 - Observability And Operations

- [x] Add structured request logging with request IDs.
- [x] Add `/api/ready` readiness checks for database and storage.
- [x] Add metrics for request latency, failed logins, sync conflicts, upload failures, and import failures.
- [ ] Add audit log pagination and export.
- [ ] Add load tests for 100 concurrent users covering login, dashboard, sync, import preview, and upload.

## P2 - Deployment

- [x] Define production environment variables in `.env.example`.
- [ ] Document HTTPS/reverse-proxy deployment.
- [x] Add CI checks for build, server syntax, PostgreSQL smoke tests, and dependency audit.
- [ ] Add a rollback plan for failed deployments.
