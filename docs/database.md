# Database Plan

The production database target is PostgreSQL. The canonical schema is managed by Prisma:

- Schema: `prisma/schema.prisma`
- Initial migration SQL: `prisma/migrations/202606220001_init/migration.sql`
- Local PostgreSQL helper: `docker-compose.yml`
- Environment template: `.env.example`

## Local Setup

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL:

```bash
docker compose up -d postgres
```

3. Apply the Prisma migration:

```bash
npm run db:migrate
```

4. Import the current JSON seed data:

```bash
npm run db:seed:json
```

5. Start the API in PostgreSQL mode:

```bash
DATA_STORE=postgres npm run api
```

6. Run the PostgreSQL smoke test:

```bash
npm run smoke:postgres
```

## Runtime Mode

The current API defaults to `DATA_STORE=json` so the MVP remains usable while PostgreSQL repositories are migrated route by route.

Use `DATA_STORE=postgres` after running the migration and JSON seed import. Auth, sessions, `/api/auth/me`, `/api/bootstrap`, `/api/sync`, equipment, point, row, project, user, media, and Excel import endpoints now have PostgreSQL runtime support. The standalone `/api/attachments` file endpoint stores files on disk and returns metadata for later record/media writes.

Health endpoints:

- `/api/health` confirms the API process is alive and reports the configured data store.
- `/api/ready` checks storage and PostgreSQL connectivity when `DATA_STORE=postgres`.

## CI Coverage

The GitHub Actions workflow in `.github/workflows/postgres-runtime.yml` starts a PostgreSQL service, applies Prisma migrations, imports `data/seed.json`, starts the API with `DATA_STORE=postgres`, and runs `scripts/smoke-postgres-api.mjs`.

## Design Notes

- Binary files are not stored in PostgreSQL. The database stores file metadata and storage paths only.
- `locations` supports a tree with `parent_id`, `type`, and `sort_order` for Project -> Building -> Floor -> Room -> Equipment workflows.
- `equipment`, `points`, and `inspection_records` include `revision` for offline sync and conflict detection.
- User project permissions are normalized through `user_project_access`.
- Sessions are modeled in PostgreSQL so the production API can move away from process-memory sessions.
