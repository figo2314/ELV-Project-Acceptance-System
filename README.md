# ELV Project Acceptance System

Offline-first web prototype for ELV/BMS project acceptance, inspection records, progress tracking, comments, and photo evidence.

## Current MVP

- Mobile-friendly project, location, team/category, equipment, and inspection flow
- Field workflow with project/location/team filters, equipment cards, point action list, quick Pass/Fail/N/A, and shared comment suggestions
- Desktop dashboard with project progress, open issues, and person statistics
- English-first UI with Traditional Chinese toggle
- Equipment, point, and sub-device hierarchy for BMS/ELV inspections
- Admin equipment manager with Excel import, template download, and direct web edit/update
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

## Web Data Management

Use the Admin tab for small projects or quick edits:

- Add equipment directly from the web form
- Edit equipment project, location, team, name, type, and status
- Add points/sub-devices under each equipment item
- Edit point name, type, reference, and status

Changes are saved to the local API database at `data/db.json`.

## Excel Import

Use the Admin tab, click `Download Excel Template`, fill it in, then upload `.xlsx`, `.xls`, or `.csv` with `Import Excel`.

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

Each row represents one point/sub-device under an equipment item. Repeat the same `Equipment` value with different `Point` values to create multiple points under the same device.

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
