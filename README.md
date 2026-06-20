# ELV Project Acceptance System

Offline-first web prototype for ELV/BMS project acceptance, inspection records, progress tracking, comments, and photo evidence.

## Current MVP

- Mobile-friendly project, location, team/category, equipment, and inspection flow
- Desktop dashboard with project progress, open issues, and person statistics
- English-first UI with Traditional Chinese toggle
- Equipment, point, and sub-device hierarchy for BMS/ELV inspections
- Admin equipment manager with Excel import
- Local browser storage for records, camera photos, and file attachments
- Offline status indicator, pending-sync queue, and API-backed sync
- PWA manifest and service worker cache for offline loading
- Lightweight Express API with a JSON database at `data/db.json`
- PostgreSQL migration-ready schema at `docs/postgres-schema.sql`

## Run Locally

```powershell
npm.cmd install
npm.cmd run dev
```

Open the local URL shown by Vite, usually `http://127.0.0.1:5173/`.

The API runs at `http://127.0.0.1:4177/api`.

## Excel Import

Use the Admin tab and upload `.xlsx`, `.xls`, or `.csv`.

Supported column names:

- `Project`
- `Location`
- `Team` / `Category` / `System`
- `Equipment` / `Equipment Name` / `Device`
- `Type` / `Equipment Type`
- `Point` / `Point Name` / `Sub Device`
- `Point Type` / `Signal Type`
- `Reference` / `Expected`
- `Assignee`
- `Due` / `Target Date`

## Build

```powershell
npm.cmd run build
```

## Suggested Next Phase

- Replace the JSON database with PostgreSQL using `docs/postgres-schema.sql`
- Add authentication and role-based permissions
- Add Excel export for device lists and checklist templates
- Generate PDF acceptance reports
- Connect AI translation for comments and report text
