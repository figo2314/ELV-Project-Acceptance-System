# Backup And Restore

Production recovery must include both PostgreSQL data and uploaded files. A database-only backup is incomplete because media binaries live on disk under `data/uploads` by default.

## Requirements

- `DATABASE_URL` points to the production PostgreSQL database.
- `pg_dump`, `pg_restore`, and `tar` are available on the server or backup runner.
- `UPLOAD_DIR` points to the upload directory. It defaults to `data/uploads`.
- `BACKUP_DIR` points to the backup output folder. It defaults to `backups`.

## Create Backup

```bash
DATA_STORE=postgres npm run backup:production
```

The script creates a timestamped folder containing:

- `postgres.dump`
- `uploads.tar.gz`
- `manifest.json`

Store this folder outside the application server, such as encrypted object storage or a secured NAS.

## Restore Backup

Restore is destructive and replaces database contents plus the upload directory:

```bash
npm run restore:production -- backups/2026-06-22T00-00-00-000Z --confirm
```

After restore:

```bash
npm run db:migrate
npm run smoke:postgres
```

## Schedule

Recommended minimum schedule:

- Daily full backup during pilot.
- Twice daily or hourly backup when many field users are uploading photos.
- Keep at least 14 daily backups and 3 monthly backups.
- Test restore on a staging database every month.

## Rollback Note

For failed deployments, restore the latest backup only if the migration or app version corrupted data. If the failure is app-only, rollback the application version first and keep the database unchanged.
