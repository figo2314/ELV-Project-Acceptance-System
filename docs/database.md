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

## Design Notes

- Binary files are not stored in PostgreSQL. The database stores file metadata and storage paths only.
- `locations` supports a tree with `parent_id`, `type`, and `sort_order` for Project -> Building -> Floor -> Room -> Equipment workflows.
- `equipment`, `points`, and `inspection_records` include `revision` for offline sync and conflict detection.
- User project permissions are normalized through `user_project_access`.
- Sessions are modeled in PostgreSQL so the production API can move away from process-memory sessions.
